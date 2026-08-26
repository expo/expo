// @ref llp/0005-runtime-loop-tools.rfc.md §Where a device reaches the dev server
// Which URL the dev server told the world to use, and whether that URL is still good.
//
// The dev-server lock (`src/devLock/`) answers where the dev server listens *on this machine*, and
// that is the right answer for every command that talks to it over HTTP. It is the wrong answer for
// the one thing a device does: `exp://127.0.0.1:8081` is unreachable from a phone and from a cloud
// simulator, and the LAN address is unreachable from a cloud simulator too. A tunnelled run has a
// third address, and only the dev server knows it.
//
// **Where it comes from.** `expo start` prints `Waiting on <url>` once the server is up, and that
// URL is the tunnel origin when a tunnel is running — `BundlerDevServer.getDevServerUrl` returns
// `constructUrl()` whenever a `AsyncWsTunnel` is active [observed — `@expo/cli`, 2026-08-25]. A
// detached run captures that line in `.expo/dev/logs/dev-detached.log`, so it is readable
// afterwards by anything that wants it. The structured `devserver:url` event carries the same fact
// with a `hostType` field, but it does not exist in any released SDK yet [observed — expo 57.0.17
// writes `metro:instantiate` and `devserver:start` into `start.log` and no `devserver:url`], so the
// printed line is what this reads.
//
// **Why the failure half lives here too.** The line above is written once and never revised. A
// tunnel that dies two hours later leaves it in place, so the log keeps advertising a host that no
// longer resolves — which is exactly how a dogfood session spent its last hour pointing a cloud
// simulator at a dead tunnel [observed — 2026-08-24]. A URL is only current if nothing below it
// says the tunnel is gone, so the two facts are read in one pass and reported together.

import { stripVTControlCharacters } from 'util';

import { readDetachedLogSync } from './logFile';

/** How a device reaches the dev server, in the vocabulary of `expo start --host`. */
export type DevServerHostType =
  /** Only a process on this machine can use it. */
  | 'localhost'
  /** A device on the same network can use it. */
  | 'lan'
  /** Anything on the internet can use it, including a cloud simulator. */
  | 'tunnel';

/** The dev server URL as the dev server itself reported it. */
export interface AdvertisedDevServerUrl {
  /** The origin, exactly as printed, e.g. `http://znakdiwe5j2n5o0.boltexpo.dev`. */
  url: string;
  /** Host and port of {@link url}, which is what an `exp://` link carries. */
  host: string;
  hostType: DevServerHostType;
}

/** Evidence in the log that the tunnel behind the advertised URL is gone. */
export interface TunnelFailure {
  /** Which signature matched, so a reader can tell a refusal from a name that stopped resolving. */
  signature: /** The websocket handshake was answered with an HTTP status instead of an upgrade. */
    | 'handshake'
    /** The tunnel host stopped resolving. */
    | 'dns'
    /** The Expo CLI's own "the tunnel is closed" line. */
    | 'closed';
  /** The line itself, so a report can quote the evidence rather than assert it. */
  line: string;
}

/** What one pass over a dev server's captured output amounts to. */
export interface DevServerLogReading {
  /** The last URL the dev server advertised, or null when it never printed one. */
  advertised: AdvertisedDevServerUrl | null;
  /**
   * The tunnel failure printed **after** that URL, or null.
   *
   * Only after: a tunnel that failed once and then connected is a working tunnel, and the URL below
   * the failure is the one a device should be given.
   */
  tunnelFailure: TunnelFailure | null;
}

/** The one command that brings a tunnel back. Named in every place a dead tunnel is reported. */
export const TUNNEL_RESTART_COMMAND = 'npx exagent dev --detach --tunnel';

/** The line `expo start` prints when the dev server is up and nobody is watching a terminal. */
const WAITING_ON = /Waiting on\s+(?<url>\S+)/;

/** Hostnames that only this machine can reach. */
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0', '[::1]']);

/** Anything that is only digits and dots is an address rather than a name. */
const IPV4_LITERAL = /^\d{1,3}(?:\.\d{1,3}){3}$/;

/**
 * Which kind of host a dev server URL names.
 *
 * A name that is not `localhost` is a tunnel: nothing else gives an Expo dev server a hostname.
 * An IP literal never is, however public it looks — a public address is somebody's machine, and
 * calling it a tunnel would let a report offer to restart something that was never started. Those
 * are reported as `lan`, which is the honest half of what is known about them: they are an address
 * a device off this machine may be able to use, and no tunnel to reconnect.
 */
export function classifyDevServerHost(hostname: string): DevServerHostType {
  const host = hostname.toLowerCase();
  if (LOCAL_HOSTNAMES.has(host)) {
    return 'localhost';
  }
  // An IPv6 literal, bracketed or not, is an address too.
  if (IPV4_LITERAL.test(host) || host.includes(':')) {
    return 'lan';
  }
  return 'tunnel';
}

/** The Expo Go deep link for a host, which is the dev server URL with the `exp` scheme. */
export function expoGoUrlForHost(host: string): string {
  return `exp://${host}`;
}

/**
 * Read what a dev server's captured output says about where it can be reached.
 *
 * Pure over the lines, so every branch is testable without a dev server, a tunnel, or a log file.
 *
 * @param lines the log, ANSI stripped or not, oldest first.
 */
export function readDevServerLog(lines: string[]): DevServerLogReading {
  let advertised: AdvertisedDevServerUrl | null = null;
  let advertisedIndex = -1;

  for (const [index, raw] of lines.entries()) {
    const parsed = parseWaitingOn(raw);
    if (parsed) {
      advertised = parsed;
      advertisedIndex = index;
    }
  }

  return {
    advertised,
    tunnelFailure: findTunnelFailure(lines, advertised, advertisedIndex),
  };
}

/**
 * The same reading, over this project's detached dev server log.
 *
 * Null when the project has no detached log at all, which is the honest answer for a dev server
 * started in somebody's terminal: its output went there, and nothing captured it.
 */
export function readDevServerLogSync(
  projectRoot: string,
  { tail = ADVERTISED_LOG_LINES }: { tail?: number } = {}
): DevServerLogReading | null {
  const read = readDetachedLogSync(projectRoot, tail);
  return read == null ? null : readDevServerLog(read.lines);
}

/**
 * How many lines of the log are searched.
 *
 * Generous rather than exact: the URL is printed near the top of a log a run truncates anyway, and
 * the failure that retires it can arrive hours of bundler output later. A whole log of a long
 * session is a few thousand lines, so this reads all of a typical one and the tail of a busy one —
 * and the tail is where a failure is, which is the half that has to be current.
 */
export const ADVERTISED_LOG_LINES = 5000;

/** The `Waiting on <url>` line, as a parsed URL, or null when this line is not one. */
function parseWaitingOn(rawLine: string): AdvertisedDevServerUrl | null {
  // The CLI underlines the URL, and a caller may hand over lines that were never stripped.
  const match = WAITING_ON.exec(stripVTControlCharacters(rawLine));
  if (!match?.groups?.url) {
    return null;
  }
  let parsed: URL;
  try {
    parsed = new URL(match.groups.url);
  } catch {
    return null;
  }
  return {
    url: parsed.origin,
    host: parsed.host,
    hostType: classifyDevServerHost(parsed.hostname),
  };
}

/** Lines that say the websocket tunnel gave up, in the order they are worth reporting. */
const FAILURE_PATTERNS: {
  signature: TunnelFailure['signature'];
  pattern: RegExp;
}[] = [
  // `ws` reports a handshake answered with anything but 101 verbatim; the dogfood's was 409
  // [observed — `ws/lib/websocket.js`, and live, 2026-08-24].
  {
    signature: 'handshake',
    pattern: /Unexpected server response:\s*(?<status>[45]\d\d)/,
  },
  // @ref packages/@expo/cli/src/start/server/AsyncWsTunnel.ts — the `disconnected` handler.
  { signature: 'closed', pattern: /Tunnel connection has been closed/i },
];

/** The name lookup that fails once the tunnel host is gone. Checked against the host, below. */
const ENOTFOUND = /getaddrinfo ENOTFOUND (?<host>\S+)/;

/**
 * The first tunnel failure printed after the advertised URL.
 *
 * Nothing is reported for a run that never had a tunnel: `Unexpected server response: 409` from an
 * app's own `fetch`, in a log of a localhost run, is the app's problem and not the dev server's.
 */
function findTunnelFailure(
  lines: string[],
  advertised: AdvertisedDevServerUrl | null,
  advertisedIndex: number
): TunnelFailure | null {
  if (advertised?.hostType !== 'tunnel') {
    return null;
  }

  for (const raw of lines.slice(advertisedIndex + 1)) {
    const line = stripVTControlCharacters(raw).trim();
    for (const { signature, pattern } of FAILURE_PATTERNS) {
      if (pattern.test(line)) {
        return { signature, line };
      }
    }
    // Scoped to the tunnel's own domain, so an app that could not reach its API does not read as
    // a dead tunnel.
    const lookup = ENOTFOUND.exec(line);
    if (lookup?.groups?.host && sharesDomain(lookup.groups.host, advertised.host)) {
      return { signature: 'dns', line };
    }
  }
  return null;
}

/**
 * Whether a hostname belongs to the same tunnel service as the advertised host.
 *
 * The tunnel's control plane and its public host are different names under one domain
 * (`ws.boltexpo.dev` and `<session>.boltexpo.dev`), and a lookup failure on either ends the tunnel.
 * Everything below the first label has to match, so `api.example.com` never counts.
 */
function sharesDomain(hostname: string, advertisedHost: string): boolean {
  const parent = (value: string) =>
    value.split(':')[0]!.toLowerCase().split('.').slice(1).join('.');
  const advertisedParent = parent(advertisedHost);
  return (
    advertisedParent.length > 0 &&
    (hostname.toLowerCase() === advertisedHost.split(':')[0]!.toLowerCase() ||
      parent(hostname) === advertisedParent)
  );
}
