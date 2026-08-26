// @ref llp/0005-runtime-loop-tools.rfc.md
// Reachability check for the dev server the runtime commands talk to.
//
// Every runtime command needs two things a project cannot promise: a dev server, and an app
// connected to it. Both are checked before a CDP connection is attempted, so the failure the
// user reads names the missing piece instead of the socket error it caused.

import { readDevServerLockAsync, readLastLoggedDevServerPort } from '../devLock';
import type { NavigatePlatform } from '../navigate/device';
import { CommandError } from '../utils/errors';
import type { CdpTarget } from './cdpClient';
import type { DeviceNameIndex } from './targetPlatform';

export { readLastLoggedDevServerPort };

/** Where `npx expo start` listens by default. */
export const DEFAULT_DEV_SERVER_URL = 'http://127.0.0.1:8081';

/** Strip trailing slashes, so `${url}/json/list` is always a well formed path. */
export function normalizeDevServerUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * Validate a `--dev-server-url` value, or fall back to the default dev server.
 *
 * Shared by every command that takes the flag, so one bad URL reads the same everywhere.
 *
 * @throws {CommandError} `BAD_ARGS` when the value is not an http(s) URL.
 */
export function resolveDevServerUrlFlag(value: unknown): string {
  if (value == null) {
    return DEFAULT_DEV_SERVER_URL;
  }
  const url = normalizeDevServerUrl(String(value));
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new CommandError(
      'BAD_ARGS',
      `--dev-server-url is not a URL: ${value}. Pass the dev server origin, for example --dev-server-url http://127.0.0.1:8081`
    );
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new CommandError(
      'BAD_ARGS',
      `--dev-server-url must be an http or https URL, but got ${value}. The dev server is reached over HTTP, for example --dev-server-url http://127.0.0.1:8081`
    );
  }
  return url;
}

/**
 * The dev server a caller named, through either of the two flags that name one, or null.
 *
 * `--port 8195` is `--dev-server-url http://127.0.0.1:8195` and nothing else. It exists because
 * `exagent dev --port 8195` is the command that started the server, and every command that then
 * talks to it wanted the *other* spelling — so an agent that had just typed a port had to translate
 * it into a URL, and got `unknown or unexpected option: --port` when it did not
 * [observed — friction run 4, 2026-08-23]. One flag name across the group is cheaper than the
 * translation, and the URL form stays for a dev server on another host.
 *
 * @param url the `--dev-server-url` value, or null/undefined when the caller named none.
 * @param port the `--port` value, or null/undefined when the caller named none.
 * @param command the command as a caller types it, for the error that names both flags.
 * @throws {CommandError} `BAD_ARGS` when both are named, or when the port is not a port.
 */
export function resolveDevServerTarget(
  url: unknown,
  port: unknown,
  command: string
): string | null {
  if (url != null && port != null) {
    throw new CommandError(
      'BAD_ARGS',
      [
        `--dev-server-url and --port both name a dev server for "exagent ${command}", and they name different ones.`,
        `Why: --port <n> is shorthand for --dev-server-url http://127.0.0.1:<n>, so passing both leaves two answers to one question and no rule for which wins.`,
        `How: pass one. Use --port ${port} for a dev server on this machine, or --dev-server-url ${url} for one anywhere else.`,
      ].join('\n')
    );
  }
  if (port != null) {
    return `http://127.0.0.1:${resolvePortFlag(port, command)}`;
  }
  return url == null ? null : resolveDevServerUrlFlag(url);
}

/**
 * A `--port` value as a port number.
 *
 * @throws {CommandError} `BAD_ARGS` when the value is not a port.
 */
export function resolvePortFlag(value: unknown, command: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new CommandError(
      'BAD_ARGS',
      [
        `--port must be a port number from 1 to 65535, but got ${String(value) || '(nothing)'}.`,
        `Why: it names the port the dev server listens on, which is what this command connects to.`,
        `How: pass one, as in "npx exagent ${command} --port 8081". Leaving it out lets this command find the dev server of this project on its own.`,
      ].join('\n')
    );
  }
  return port;
}

/**
 * The last sentence of a "no dev server answered" error: what to do about the URL.
 *
 * Two answers, and telling them apart is the whole point. A caller that let this CLI find the dev
 * server is told how to name one. A caller that **named** it is not told to name it — that sentence
 * suggested the very flag they had just passed, which reads as if the tool had not noticed
 * [observed — friction run 4, 2026-08-23: `runtime:reload --dev-server-url http://127.0.0.1:9999`].
 * What helps there is that the value they gave is the one that was tried.
 *
 * @param explicit whether the caller named the dev server, with `--dev-server-url` or `--port`.
 */
export function howToNameTheDevServer(explicit: boolean): string {
  return explicit
    ? `The URL above is the one you named, so nothing else was tried — check its host and port against the dev server you meant ("npx exagent status --json" reports this project's).`
    : `Pass --dev-server-url, or --port for one on this machine, to reach a dev server on another host or port.`;
}

/** Ports `discoverDevServerAsync` scans when no explicit URL was given: Metro's default and
 * the ports `expo start` walks to when 8081 is taken. */
export const DEV_SERVER_SCAN_PORTS = [8081, 8082, 8083, 8084, 8085];

/**
 * Which step of {@link discoverDevServerAsync} produced the URL.
 *
 * Reported rather than kept private because the steps differ in how much they prove: `flag` and
 * `lock` name a dev server on purpose, `log` and `scan` are guesses that happened to answer. A
 * caller reading `scan` knows the caveat below applies to its result, and can pass
 * `--dev-server-url` to remove it.
 */
export type DevServerSource =
  /** An explicit `--dev-server-url`. */
  | 'flag'
  /** The project's dev-server lock, held by an `exagent`-started dev server. */
  | 'lock'
  /** The port the project's own `start.log` last recorded. */
  | 'log'
  /** Metro's default port, 8081. Also the reported source when nothing answered anywhere. */
  | 'default'
  /** One of the fallback ports `expo start` walks to, found by scanning. */
  | 'scan';

export interface DevServerDiscovery extends DevServerProbe {
  /** The dev server origin the probe answered on (the explicit URL, or the discovered one). */
  devServerUrl: string;
  /** The step that produced {@link devServerUrl}. */
  source: DevServerSource;
  /**
   * True when the URL was found rather than named: the lock, the log, or the port scan.
   *
   * Kept as the coarse form of {@link source}, for callers that only ask whether the URL was
   * guessed at.
   */
  discovered: boolean;
}

/** The two ways of describing one discovery step, so the sources and the flag stay in step. */
function foundBy(source: DevServerSource): { source: DevServerSource; discovered: boolean } {
  return { source, discovered: source === 'lock' || source === 'log' || source === 'scan' };
}

/**
 * Probe for a dev server. An explicit URL is probed alone (the user named it, so no guessing);
 * without one, 8081 is tried first and, only when it does not answer, the next few ports
 * `expo start` falls back to are scanned in parallel with a short timeout each.
 *
 * Caveat (documented, accepted): the scan cannot prove the server belongs to *this* project —
 * on a machine running two Metros, the first answering port wins. `--dev-server-url` is the
 * precise spelling.
 */
export async function discoverDevServerAsync(
  explicitUrl?: string,
  { timeoutMs = 800, projectRoot }: { timeoutMs?: number; projectRoot?: string } = {}
): Promise<DevServerDiscovery> {
  if (explicitUrl != null) {
    const probe = await probeDevServerAsync(explicitUrl);
    return { ...probe, devServerUrl: normalizeDevServerUrl(explicitUrl), ...foundBy('flag') };
  }

  const withTimeout = async (url: string): Promise<DevServerProbe> => {
    return await Promise.race([
      probeDevServerAsync(url),
      new Promise<DevServerProbe>((resolve) =>
        setTimeout(
          () =>
            resolve({ reachable: false, targets: [], reason: `no answer within ${timeoutMs}ms` }),
          timeoutMs
        )
      ),
    ]);
  };

  // Step 0 — the project's dev-server lock (`src/devLock/`): a socket an `exagent`-started dev
  // server holds open for as long as it runs, which answers with the URL it listens on. Nothing
  // answers unless a process is alive, so this step has no stale case to guard against. The URL
  // is still probed, never trusted: the lock proves that the wrapper is alive, and the probe
  // proves that the dev server behind it is.
  if (projectRoot != null) {
    const lock = await readDevServerLockAsync(projectRoot);
    if (lock != null) {
      const lockUrl = normalizeDevServerUrl(lock.url);
      const lockProbe = await withTimeout(lockUrl);
      if (lockProbe.reachable) {
        return { ...lockProbe, devServerUrl: lockUrl, ...foundBy('lock') };
      }
    }
  }

  // Step 1 — the project's own log: `expo start` logs a `metro:instantiate` event with the port
  // into `.expo/dev/logs/start.log`. Project-scoped, but the log outlives the server that wrote
  // it and names no PID, so the port is only a candidate until it answers a probe. This is what
  // finds a dev server started by `expo start` directly, with no `exagent` wrapper to hold a lock.
  const loggedPort = projectRoot != null ? readLastLoggedDevServerPort(projectRoot) : null;
  if (loggedPort != null && loggedPort !== 8081) {
    const loggedUrl = `http://127.0.0.1:${loggedPort}`;
    const loggedProbe = await withTimeout(loggedUrl);
    if (loggedProbe.reachable) {
      return { ...loggedProbe, devServerUrl: loggedUrl, ...foundBy('log') };
    }
  }

  const defaultProbe = await withTimeout(DEFAULT_DEV_SERVER_URL);
  if (defaultProbe.reachable) {
    return { ...defaultProbe, devServerUrl: DEFAULT_DEV_SERVER_URL, ...foundBy('default') };
  }

  const candidates = DEV_SERVER_SCAN_PORTS.slice(1).map((port) => `http://127.0.0.1:${port}`);
  const probes = await Promise.all(
    candidates.map(async (url) => ({ url, probe: await withTimeout(url) }))
  );
  const hit =
    probes.find(({ probe }) => probe.reachable && probe.targets.length > 0) ??
    probes.find(({ probe }) => probe.reachable);
  if (hit) {
    return { ...hit.probe, devServerUrl: hit.url, ...foundBy('scan') };
  }

  // Nothing answered anywhere. The default URL is reported so the caller has a dev server to name
  // in its error, and `default` is the step that produced it.
  return { ...defaultProbe, devServerUrl: DEFAULT_DEV_SERVER_URL, ...foundBy('default') };
}

export interface DevServerProbe {
  /** The dev server answered the debugger target list. */
  reachable: boolean;
  /** Debugger targets the dev server reported. Empty when it is unreachable. */
  targets: CdpTarget[];
  /** Why the dev server could not be reached, for the error message. */
  reason?: string;
}

/**
 * Ask the dev server for its debugger targets.
 *
 * Never throws: an unreachable dev server is an answer, so callers that can work without one
 * (deep-link navigation to a development build) are not forced into a failure path.
 */
export async function probeDevServerAsync(devServerUrl: string): Promise<DevServerProbe> {
  const url = `${normalizeDevServerUrl(devServerUrl)}/json/list`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (error: unknown) {
    return {
      reachable: false,
      targets: [],
      reason: error instanceof Error ? error.message : String(error),
    };
  }

  if (!response.ok) {
    return {
      reachable: false,
      targets: [],
      reason: `${url} answered ${response.status} ${response.statusText}`,
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error: unknown) {
    return {
      reachable: false,
      targets: [],
      reason: `${url} did not answer with JSON: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  if (!Array.isArray(payload)) {
    return { reachable: false, targets: [], reason: `${url} did not answer with an array` };
  }

  return { reachable: true, targets: payload as CdpTarget[] };
}

/**
 * How long a command may keep asking for a debugger target before it reports that none is there.
 *
 * The window an app is invisible in while it reloads [observed — 2026-08-23, live on port 8190:
 * the pre-reload page id was served until 506 ms and the new one appeared at 761 ms]. During it
 * `/json/list` can be empty, and a command that read it once reported "no app is connected" for an
 * app that was on its way back — friction run 4's F39, which made the reload -> errors chain the
 * CLI prints as a follow-up fail one run in three. Bounded on purpose: an app that is genuinely
 * closed has to be reported quickly, so this buys the reconnect window and nothing more.
 */
export const APP_RECONNECT_GRACE_MS = 3000;

/** How often the target list is re-read while that grace period runs. */
const APP_RECONNECT_POLL_MS = 250;

export interface RequireConnectedAppOptions {
  /**
   * How long to keep asking when the dev server reports no debugger target, in milliseconds.
   *
   * Zero — the default — reports the first answer, which is what a command that is not following a
   * reload wants. {@link APP_RECONNECT_GRACE_MS} is what a command in the reload chain passes.
   */
  retryMs?: number;
  /** Whether the caller named the dev server, with `--dev-server-url` or `--port`. */
  explicit?: boolean;
  /**
   * Require an app on this platform, instead of any app.
   *
   * @ref ./targetPlatform — friction run 6's F51. A command told `--android` must not be answered
   * by the iOS simulator that happens to be attached to the same dev server, and "no Android app is
   * connected while an iOS one is" needs a different sentence from "nothing is connected".
   */
  platform?: NavigatePlatform;
  /** What this machine's device tools reported, for {@link platform}. */
  deviceIndex?: DeviceNameIndex;
}

/**
 * Resolve the debugger targets of a dev server that has an app connected to it.
 *
 * With a platform, the targets that come back are that platform's alone, and a dev server whose
 * only apps are on another platform fails rather than handing back somebody else's runtime.
 *
 * @throws {CommandError} `NO_DEV_SERVER` when nothing answers, `NO_APP_CONNECTED` when the dev
 * server runs but reports no debugger target this command may read.
 */
export async function requireConnectedAppAsync(
  devServerUrl: string,
  { explicit = false, retryMs = 0, platform, deviceIndex }: RequireConnectedAppOptions = {}
): Promise<CdpTarget[]> {
  const url = normalizeDevServerUrl(devServerUrl);
  let probe = await probeDevServerAsync(url);

  // Only an empty list is worth asking again about: an unreachable dev server does not become
  // reachable by re-reading it within three seconds, and a list with something in it is an answer.
  if (probe.reachable && probe.targets.length === 0 && retryMs > 0) {
    const deadline = Date.now() + retryMs;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, APP_RECONNECT_POLL_MS));
      probe = await probeDevServerAsync(url);
      if (!probe.reachable || probe.targets.length > 0) {
        break;
      }
    }
  }

  if (!probe.reachable) {
    const error = new CommandError(
      'NO_DEV_SERVER',
      [
        `No Expo dev server answered at ${url}, so there is no app runtime to talk to.`,
        `Why: the request for the debugger target list failed (${probe.reason}).`,
        `How: start one with "npx exagent dev --detach" in the project root and open the app with "npx exagent navigate /", then run this command again. ${howToNameTheDevServer(explicit)}`,
      ].join('\n')
    );
    // The same command the How: names. They disagreed — `npx expo start` above and `npx exagent
    // dev` here — which is a failure telling a reader two things [observed — friction run 5].
    error.suggestedCommand = 'npx exagent dev --detach';
    throw error;
  }

  if (probe.targets.length === 0) {
    const error = new CommandError(
      'NO_APP_CONNECTED',
      [
        `The Expo dev server at ${url} is running, but no app is connected to it.`,
        `Why: its debugger target list (${url}/json/list) is empty${retryMs > 0 ? `, and it was still empty ${retryMs}ms later` : ''}, so there is no JavaScript runtime to talk to.`,
        // Not "press i in the dev server's terminal": a dev server this CLI started with --detach
        // has no terminal to press a key in, and a driving agent has no keyboard for one that has
        // [friction run 5, F48-5]. `navigate` is the command that does the same thing.
        `How: open the app on a device or simulator with "npx exagent navigate /", wait for the bundle to finish loading with "npx exagent dev:wait --require-app", then run this command again.`,
      ].join('\n')
    );
    error.suggestedCommand = 'npx exagent navigate /';
    throw error;
  }

  if (platform == null) {
    return probe.targets;
  }

  const { buildDeviceNameIndexIfNeededAsync, scopeTargets } =
    require('./targetPlatform') as typeof import('./targetPlatform');
  const scoped = scopeTargets(
    probe.targets,
    platform,
    deviceIndex ?? (await buildDeviceNameIndexIfNeededAsync(probe.targets))
  );
  if (scoped.matched.length > 0) {
    return scoped.matched;
  }
  throw noAppOnPlatformError(url, platform, scoped);
}

/**
 * The failure for a dev server whose apps are all on some other platform, or unreadable.
 *
 * Two shapes, because the next steps differ. Apps on another platform means `--android` was asked
 * of a machine running the iOS app, and the fix is to open the Android one. Apps nobody could place
 * means the evidence ran out, and the honest answer is to say which evidence and stop — the whole
 * of F51 was this command answering from a runtime it had not identified.
 */
function noAppOnPlatformError(
  url: string,
  platform: NavigatePlatform,
  scoped: { otherPlatform: { platform: NavigatePlatform }[]; undetermined: unknown[] }
): CommandError {
  const others = scoped.otherPlatform.map((entry) => entry.platform);
  const uniqueOthers = [...new Set(others)];

  const error = new CommandError(
    'NO_APP_CONNECTED',
    uniqueOthers.length > 0
      ? [
          `No ${platform} app is connected to the Expo dev server at ${url}, so there is nothing on ${platform} to read.`,
          `Why: its debugger target list names ${others.length} app${others.length === 1 ? '' : 's'}, and ${others.length === 1 ? 'it is' : 'they are'} on ${uniqueOthers.join(' and ')}${scoped.undetermined.length > 0 ? `, plus ${scoped.undetermined.length} whose platform nothing in the target names` : ''}. Reading one of those would answer a question about ${uniqueOthers[0]} while reporting it as ${platform}.`,
          `How: open the app on ${platform} with "npx exagent navigate / --${platform}", then run this command again. Drop --${platform} to read whichever app is connected.`,
        ].join('\n')
      : [
          `No app connected to the Expo dev server at ${url} could be shown to be running on ${platform}.`,
          `Why: its debugger target list names ${scoped.undetermined.length} app${scoped.undetermined.length === 1 ? '' : 's'}, and nothing in ${scoped.undetermined.length === 1 ? 'its target' : 'their targets'} says which platform ${scoped.undetermined.length === 1 ? 'it is' : 'they are'} on — the dev server does not label them, so this is read from the device name and the app id. A development build on a physical device can look like this.`,
          `How: drop --${platform} to read the app that is connected, which is the honest command when only one is. To have the platform recognised, connect the device this machine's device tools can see ("adb devices -l", "xcrun simctl list devices booted").`,
        ].join('\n')
  );
  error.suggestedCommand =
    uniqueOthers.length > 0 ? `npx exagent navigate / --${platform}` : 'npx exagent status --json';
  return error;
}
