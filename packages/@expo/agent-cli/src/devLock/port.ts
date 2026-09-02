// @ref llp/0004-smart-start-and-project-state.rfc.md §Status
// Which port the dev server actually listens on.
//
// The wrapper cannot know: `expo start` walks past a taken port, and `expo run:ios` starts a dev
// server the wrapper passed no port to at all. What it can do is read the port back out of the
// dev server's own structured log, and only trust entries the current run wrote.

import fs from 'fs';
import path from 'path';

/** Where `npx expo start` listens when nothing says otherwise. */
export const DEFAULT_DEV_SERVER_PORT = 8081;

/** How often the dev server's log is re-read while waiting for the port. */
export const PORT_WATCH_INTERVAL_MS = 500;

/** How long the dev server gets to report its port before the fallbacks are used. */
export const PORT_WATCH_TIMEOUT_MS = 20_000;

/** Structured log `expo start` writes its `metro:instantiate` event into, relative to a project. */
const START_LOG_SEGMENTS = ['.expo', 'dev', 'logs', 'start.log'];

/**
 * Last `metro:instantiate` port in `projectRoot/.expo/dev/logs/start.log`, or null.
 *
 * The log outlives the dev server that wrote it, so an entry alone proves nothing: without
 * `since` the port is a candidate a caller still has to probe, and with `since` an entry from an
 * earlier run is dropped outright. `2g` timestamps every line in the `_t` field, in epoch
 * milliseconds, which is what makes the cutoff possible.
 *
 * @param since Epoch milliseconds; entries written before this are ignored, as is an entry with
 * no timestamp at all — a line that cannot prove it belongs to this run does not get to.
 */
export function readLastLoggedDevServerPort(
  projectRoot: string,
  { since }: { since?: number } = {}
): number | null {
  let contents: string;
  try {
    contents = fs.readFileSync(path.join(projectRoot, ...START_LOG_SEGMENTS), 'utf8');
  } catch {
    return null;
  }

  let port: number | null = null;
  for (const line of contents.split('\n')) {
    if (!line.includes('"metro:instantiate"')) {
      continue;
    }
    let entry: { _e?: string; _t?: unknown; port?: unknown };
    try {
      entry = JSON.parse(line);
    } catch {
      // A torn write is not an answer; keep scanning.
      continue;
    }
    if (entry._e !== 'metro:instantiate' || typeof entry.port !== 'number') {
      continue;
    }
    if (since != null && (typeof entry._t !== 'number' || entry._t < since)) {
      continue;
    }
    port = entry.port;
  }
  return port;
}

/**
 * The `--port` (or `-p`) value of an `expo` invocation, or null when it names none.
 *
 * Scanning stops at `--`: `expo start` forwards everything after the separator, so a `--port`
 * there belongs to something else.
 */
export function readPortArg(args: string[]): number | null {
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]!;
    if (arg === '--') {
      return null;
    }
    const value =
      arg === '--port' || arg === '-p'
        ? args[index + 1]
        : /^(--port|-p)=/.test(arg)
          ? arg.slice(arg.indexOf('=') + 1)
          : undefined;
    if (value == null) {
      continue;
    }
    const port = Number(value);
    if (Number.isInteger(port) && port > 0) {
      return port;
    }
  }
  return null;
}

export interface ResolvedDevServerPort {
  port: number;
  /** `log`: the dev server reported it. `arg`: the command line asked for it. `default`: neither. */
  source: 'log' | 'arg' | 'default';
}

export interface ResolveDevServerPortOptions {
  /** Epoch milliseconds of the spawn; log entries older than this belong to an earlier run. */
  since: number;
  /** Whether the dev server is still running. Waiting stops as soon as it is not. */
  isRunning?: () => boolean;
  /**
   * Settles when the dev server has stopped, which cuts the wait between two reads short.
   *
   * Without it a dev server that fails immediately would still cost a full `intervalMs` before
   * `isRunning` is consulted again, and that delay is added to every failed start.
   */
  stopped?: Promise<unknown>;
  intervalMs?: number;
  timeoutMs?: number;
  /**
   * Called with the answer as soon as there is one, before the lock does anything with it.
   *
   * For a caller that has to say something about the dev server it started — where to open it, in
   * the follow-ups — and must not say it about a port nothing reported. `source` is the whole
   * point: `default` means neither the dev server nor the command line named a port, so there is
   * nothing to vouch for.
   */
  onResolved?: (resolved: ResolvedDevServerPort) => void;
}

/**
 * Wait for the dev server to report its port, then fall back to what the command line asked for.
 *
 * Polling, rather than watching the file: the log is truncated and appended to by another process,
 * and `fs.watch` reports those two operations differently on every platform. A re-read every half
 * second costs nothing next to a starting bundler.
 */
export async function resolveDevServerPortAsync(
  projectRoot: string,
  args: string[],
  {
    since,
    isRunning = () => true,
    stopped,
    intervalMs = PORT_WATCH_INTERVAL_MS,
    timeoutMs = PORT_WATCH_TIMEOUT_MS,
    onResolved,
  }: ResolveDevServerPortOptions
): Promise<ResolvedDevServerPort> {
  const deadline = Date.now() + timeoutMs;
  const answer = (resolved: ResolvedDevServerPort): ResolvedDevServerPort => {
    onResolved?.(resolved);
    return resolved;
  };

  for (;;) {
    const logged = readLastLoggedDevServerPort(projectRoot, { since });
    if (logged != null) {
      return answer({ port: logged, source: 'log' });
    }
    // A dev server that is gone will never report a port, and neither will one that has taken
    // longer than any start takes.
    if (!isRunning() || Date.now() >= deadline) {
      break;
    }
    await waitAsync(intervalMs, stopped);
  }

  const requested = readPortArg(args);
  return answer(
    requested != null
      ? { port: requested, source: 'arg' }
      : { port: DEFAULT_DEV_SERVER_PORT, source: 'default' }
  );
}

/**
 * Wait out one interval, or until the dev server stops.
 *
 * The timer is deliberately not unref'd: the caller is awaiting this, and a process whose only
 * pending work is unref'd exits with the event loop instead of finishing it.
 */
function waitAsync(ms: number, stopped?: Promise<unknown>): Promise<void> {
  return new Promise<void>((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(finish, ms);
    stopped?.then(finish, finish);
  });
}
