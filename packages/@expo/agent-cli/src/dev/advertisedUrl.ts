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
// **What this deliberately does not do.** It does not watch for the tunnel dying. A tunnel's
// lifetime is `@expo/ws-tunnel`'s to manage and the Expo CLI's to report; this file answers one
// question — which URL to print — and a wrapper that also tried to diagnose the transport would be
// claiming knowledge it reads out of somebody else's prose [decided, 2026-08-26].

import fs from 'fs';
import { stripVTControlCharacters } from 'util';

import { readDevServerLockAsync } from '../devLock';
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

/** What one pass over a dev server's captured output amounts to. */
export interface DevServerLogReading {
  /** The last URL the dev server advertised, or null when it never printed one. */
  advertised: AdvertisedDevServerUrl | null;
}

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
 * An IP literal never is, however public it looks. Those are reported as `lan`, which is the honest
 * half of what is known about them: an address a device off this machine may be able to use.
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

  for (const raw of lines) {
    const parsed = parseWaitingOn(raw);
    if (parsed) {
      advertised = parsed;
    }
  }

  return { advertised };
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
): CapturedDevServerLog | null {
  const read = readDetachedLogSync(projectRoot, tail);
  if (read == null) {
    return null;
  }
  return { ...readDevServerLog(read.lines), modifiedAt: modifiedAtSync(read.logFile) };
}

/** A reading, plus when the file it came from was last written. */
export interface CapturedDevServerLog extends DevServerLogReading {
  /** Epoch milliseconds of the log's last write, or null when it could not be read. */
  modifiedAt: number | null;
}

function modifiedAtSync(logFile: string): number | null {
  try {
    return fs.statSync(logFile).mtimeMs;
  } catch {
    return null;
  }
}

/** Where a device off this machine can reach this project's dev server, right now. */
export interface DevServerReach {
  /**
   * The URL the dev server advertised, when it is this project's *current* dev server that
   * advertised it. Null when nothing captured one, or when the log belongs to an earlier run.
   */
  advertised: AdvertisedDevServerUrl | null;
  /** Whether a dev server of this project is running now, per its lock. */
  running: boolean;
  /** Why {@link advertised} is null, for a report that has to explain itself. */
  reason: string | null;
}

/**
 * Whether the tunnel a reading advertised is one a device may be given.
 *
 * Two things have to hold, and each has been wrong on its own: the run has to have had a tunnel at
 * all, and the dev server has to still be running. Whether the tunnel *itself* is healthy is not
 * asked — that is the transport's business, not this wrapper's.
 */
export function isTunnelCurrent(reach: DevServerReach): boolean {
  return reach.running && reach.advertised?.hostType === 'tunnel';
}

/**
 * Decide what a captured log is still allowed to claim, given the dev server that is running.
 *
 * Pure, so the one rule that is easy to get wrong is testable: a log **older than the lock** is a
 * previous run's. `dev --detach` truncates the log on each run, and refuses to start a second dev
 * server while a lock is held, so a live detached run always has a log written after its lock was
 * taken. A dev server started attached writes to a terminal and leaves the previous detached log
 * untouched — and that is the case where reading a tunnel host out of it would hand a device the
 * address of a dev server that stopped days ago.
 */
export function resolveDevServerReach(
  captured: CapturedDevServerLog | null,
  lock: { startedAt: string } | null
): DevServerReach {
  const running = lock != null;

  if (captured == null) {
    return {
      advertised: null,
      running,
      reason: running
        ? 'this dev server was started attached, so nothing captured the URL it printed'
        : 'this project has no detached dev server log',
    };
  }

  const lockStartedAt = lock ? Date.parse(lock.startedAt) : NaN;
  if (
    Number.isFinite(lockStartedAt) &&
    captured.modifiedAt != null &&
    captured.modifiedAt < lockStartedAt
  ) {
    return {
      advertised: null,
      running,
      reason:
        'the captured log was last written before the dev server that is running started, so it belongs to an earlier run',
    };
  }

  return {
    advertised: captured.advertised,
    running,
    reason: captured.advertised ? null : 'the captured log never named a dev server URL',
  };
}

/** {@link resolveDevServerReach} over this project's lock and its captured log. */
export async function resolveDevServerReachAsync(projectRoot: string): Promise<DevServerReach> {
  const [lock, captured] = await Promise.all([
    readDevServerLockAsync(projectRoot),
    Promise.resolve(readDevServerLogSync(projectRoot)),
  ]);
  const fromLog = resolveDevServerReach(captured, lock);
  if (lock == null || fromLog.advertised?.hostType === 'tunnel') {
    // A log that already names a host a device off this machine can use is the best answer there
    // is: it is the dev server's own account of the run, and a second request cannot improve on it.
    return fromLog;
  }
  // The log is not the only place the host is written, and it is not always the better one. Two
  // live runs settled that:
  //
  //  - `Waiting on <url>` is printed once, by a *terminal* run — a detached `--tunnel` run's log
  //    did not contain the tunnel host at all while the tunnel was up [observed — live staging,
  //    2026-08-26, S3], so every command that needed the address a device uses reported null and
  //    asked the caller for `--dev-server-url`;
  //  - a dev server serving a **public origin** through a proxy prints
  //    `Waiting on http://localhost:<port>` and advertises the origin in its manifest [observed —
  //    2026-08-27, `EXPO_PACKAGER_PROXY_URL` against a public host, while validating the cloud
  //    reload]. Reading the log there produced `hostType: localhost` and a refusal to open the app
  //    on a cloud simulator that could have loaded it.
  //
  // The dev server itself knows: it builds the manifest's `launchAsset.url` from
  // `getDevServerUrl()`, which is the tunnel origin whenever a tunnel is running and the proxy
  // origin whenever one is set. One request to a dev server this project has a lock for answers it.
  //
  // It replaces the log's reading only when it names a **tunnel**: a manifest that names this
  // machine is no better than a log that does, and swapping a LAN address for `localhost` would
  // hand back a URL a phone cannot use.
  // @ref llp/0021-honest-reports.rfc.md §The rules
  const fromManifest = await fetchAdvertisedUrlAsync(lock.url);
  if (fromManifest == null) {
    return fromLog;
  }
  return fromLog.advertised == null || fromManifest.hostType === 'tunnel'
    ? { advertised: fromManifest, running: true, reason: null }
    : fromLog;
}

/** How long the manifest request may take before the host counts as unknown. */
const MANIFEST_TIMEOUT_MS = 2500;

/**
 * The dev server URL a running dev server builds its own manifest from, or null.
 *
 * `accept: application/json` for the same reason `runtime`'s bundle check asks for it: the same
 * manifest is served as `multipart/mixed` to an Expo Updates client, and nothing here has a reason
 * to parse multipart framing to reach an object it can ask for directly.
 *
 * Never throws. A dev server that is starting, gone, or not an Expo dev server answers null, and
 * the caller says the host is unknown rather than inventing one.
 */
export async function fetchAdvertisedUrlAsync(
  devServerOrigin: string,
  {
    platform = 'ios',
    timeoutMs = MANIFEST_TIMEOUT_MS,
  }: { platform?: string; timeoutMs?: number } = {}
): Promise<AdvertisedDevServerUrl | null> {
  const manifestUrl = `${devServerOrigin.replace(/\/+$/, '')}/`;
  let payload: unknown;
  try {
    const response = await fetch(manifestUrl, {
      headers: { 'expo-platform': platform, accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
      return null;
    }
    payload = await response.json();
  } catch {
    return null;
  }

  const launchAsset = (payload as { launchAsset?: { url?: unknown } } | null)?.launchAsset;
  if (typeof launchAsset?.url !== 'string' || !launchAsset.url) {
    return null;
  }
  try {
    // Resolved against the manifest URL, because the dev server answers with a path-relative URL
    // when the request carried a `Forwarded` header [observed — `ManifestMiddleware`].
    const parsed = new URL(launchAsset.url, manifestUrl);
    return {
      url: parsed.origin,
      host: parsed.host,
      hostType: classifyDevServerHost(parsed.hostname),
    };
  } catch {
    return null;
  }
}

/**
 * How many lines of the log are searched.
 *
 * Generous rather than exact: the URL is printed near the top of a log a run truncates anyway, and
 * a caller usually asks for the tail. Reading a few thousand lines covers all of a typical session's
 * log and the head of a busy one, which is where the line is.
 */
export const ADVERTISED_LOG_LINES = 5000;

/**
 * The `Waiting on <url>` line, as a parsed URL, or null when this line is not one.
 *
 * **The scheme in that line is not always the dev server's.** With the v2 tunnel active,
 * `getDevServerUrl()` builds the URL with no scheme option, so it picks up the *deep-link* scheme of
 * the app config and prints `exp+sampleapp://<tunnel host>` [observed — 2026-08-27, and
 * reproduced against this monorepo's own `UrlCreator`; llp/0010 §Upstream asks records the ask].
 * `URL.origin` is the string `"null"` for every non-special scheme, so reading it produced
 * `tunnelUrl: "null"` — a report field carrying the word rather than a null.
 *
 * So the host is taken as the fact the line carries, and the origin is rebuilt: `http`/`https` are
 * kept when the line had one, and anything else becomes `https` for a tunnel host and `http`
 * otherwise — the same rule `devClientConnectUrl` applies, because a tunnel terminates TLS and a LAN
 * address does not.
 */
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
  if (!parsed.host) {
    // A URL with no authority at all names no dev server — `exp+app:///--/route` is a route link.
    return null;
  }

  const hostType = classifyDevServerHost(parsed.hostname);
  const scheme =
    parsed.protocol === 'http:' || parsed.protocol === 'https:'
      ? parsed.protocol.slice(0, -1)
      : hostType === 'tunnel'
        ? 'https'
        : 'http';
  return { url: `${scheme}://${parsed.host}`, host: parsed.host, hostType };
}
