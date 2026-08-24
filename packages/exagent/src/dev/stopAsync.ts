// @ref llp/0004-smart-start-and-project-state.rfc.md §`exagent status`
// @ref llp/0010-agent-conventions.rfc.md §Exit codes
// Stop this project's dev server.
//
// The friction this replaces is a shell incantation an agent has to compose and get right:
// `lsof -ti tcp:8081 | xargs kill`. Every part of it is a guess — which port, whether the pid on
// it is this project's dev server, whether SIGTERM was enough — and a wrong guess kills something
// the caller did not mean to.
//
// The lock already answers all of it. `src/devLock/` holds a socket for as long as an
// `exagent`-started dev server runs, and the line it answers with carries the wrapper's `pid`
// alongside the URL and port. Signalling that pid is enough for the whole tree: both spawn paths
// install forwarders for `SIGINT`/`SIGTERM` and pass them to the `expo start` child
// [observed — `src/utils/subprocess.ts`, `src/utils/expoCli.ts` `runExpoAsync`], so the wrapper
// takes Metro with it and releases the lock on the way out.
//
// The lock is also what makes the *negative* answer honest: a port that answers with no lock
// behind it is a dev server this CLI did not start, and the report says so instead of killing it.

import chalk from 'chalk';

import { readDevServerLockAsync, type DevServerLockInfo } from '../devLock';
import { event as cliEvent } from '../events';
import { EXIT_OK, EXIT_OUTCOME_FAILED } from '../exitCodes';
import { followUpsEnabled, reportFollowUps, type FollowUp } from '../followups';
import * as Log from '../log';
import { PACKAGER_STATUS_READY } from '../runtime/waitReady';
import { spawnCaptureAsync } from '../utils/spawnCapture';
import { debugEvent, event } from './events';
import { findPortListenerAsync, type PortListener } from './portListener';
import type { DevStopOptions } from './resolveStopOptions';

/** How often to re-check whether the dev server has gone. */
const POLL_INTERVAL_MS = 150;

/**
 * Why a dev server was not stopped.
 *
 * A closed set rather than a sentence, because the three cases need three different next actions
 * and an agent must not have to read English to tell them apart.
 */
export type DevStopSkipReason =
  /** Nothing was running: no lock answered and nothing listens on the port. */
  | 'not-running'
  /** Something listens, but no lock answers for it, so this CLI did not start it. */
  | 'foreign-dev-server'
  /** The signal was sent and the dev server was still there when the wait ran out. */
  | 'still-running';

/**
 * Machine shape of `exagent dev:stop --json`.
 *
 * @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — one JSON object on stdout,
 * every key always present, and a fact the run does not have is null.
 */
export interface DevStopResultJson {
  /** A dev server was running and is not running now. */
  stopped: boolean;
  /** PID that was signalled, or the listener's PID when one was found but not signalled. */
  pid: number | null;
  /** Port the dev server was on, from the lock or from `--port`. */
  port: number | null;
  /** Origin the dev server listened on, when a lock named one. */
  url: string | null;
  /** Whether a lock answered for it: the difference between this CLI's dev server and a stranger's. */
  lockHeld: boolean;
  /** Signal that was sent, or null when nothing was signalled. */
  signal: string | null;
  /** The dev server was killed after `--force`, rather than asked to stop. */
  forced: boolean;
  /** Why nothing was stopped. Null exactly when {@link stopped} is true. */
  reason: DevStopSkipReason | null;
  /** One sentence of detail for {@link reason}. Null exactly when {@link stopped} is true. */
  detail: string | null;
  /** How long the whole stop took, in milliseconds. */
  waitedMs: number;
  followups: FollowUp[];
}

/**
 * Stop this project's dev server.
 *
 * @returns the exit code: `0` stopped, or nothing was running; `20` something is still there.
 */
export async function devStopAsync(
  projectRoot: string,
  options: DevStopOptions
): Promise<number> {
  const startedAt = Date.now();
  const lock = await readDevServerLockAsync(projectRoot);
  debugEvent('stop_lock_read', { held: lock != null, pid: lock?.pid ?? null });

  const report = lock
    ? await stopLockedDevServerAsync(lock, options, startedAt)
    : await stopUnlockedDevServerAsync(options, startedAt);

  report.followups = followUpsEnabled(options.followups) ? buildFollowUps(report) : [];

  event('stop_done', {
    stopped: report.stopped,
    pid: report.pid,
    reason: report.reason,
  });
  cliEvent('dev_stop', {
    stopped: report.stopped,
    pid: report.pid,
    port: report.port,
    lockHeld: report.lockHeld,
    reason: report.reason,
  });

  if (options.json) {
    Log.log(JSON.stringify(report, null, 2));
  } else {
    printHumanReport(report);
  }

  const exitCode = report.stopped || report.reason === 'not-running' ? EXIT_OK : EXIT_OUTCOME_FAILED;
  if (exitCode !== EXIT_OK) {
    Log.error(explainFailure(report, options));
  }

  reportFollowUps('dev:stop', report.followups, { json: options.json });
  return exitCode;
}

/** The ordinary path: a lock answers, so the pid to signal is known and so is what it owns. */
async function stopLockedDevServerAsync(
  lock: DevServerLockInfo,
  options: DevStopOptions,
  startedAt: number
): Promise<DevStopResultJson> {
  const base: DevStopResultJson = {
    stopped: false,
    pid: lock.pid,
    port: lock.port,
    url: lock.url,
    lockHeld: true,
    signal: null,
    forced: false,
    reason: null,
    detail: null,
    waitedMs: 0,
    followups: [],
  };

  // A signal that cannot be delivered is not a failure to stop: a lock answering for a pid that
  // is gone is the one case the socket cannot produce on its own, but a lock held by a *different*
  // user's process can, and `ESRCH` there means the thing is already not running.
  const sent = await signalProcessAsync(lock.pid, options.signal);
  base.signal = sent.delivered ? options.signal : null;
  debugEvent('stop_signalled', { pid: lock.pid, signal: options.signal, ok: sent.delivered });

  const gone = await waitForStopAsync(lock, options.timeoutMs);
  base.waitedMs = Date.now() - startedAt;

  if (gone) {
    base.stopped = true;
    return base;
  }

  base.reason = 'still-running';
  base.detail = sent.delivered
    ? `${options.signal} was sent to ${lock.pid}, and its dev server was still answering ${options.timeoutMs}ms later`
    : `${options.signal} could not be delivered to ${lock.pid} (${sent.error ?? 'no reason given'}), and its dev server is still answering`;
  return base;
}

/**
 * No lock answered. Either nothing is running, or something this CLI did not start is.
 *
 * The two are told apart by the port, and the difference matters more than it looks: killing a
 * listener nobody asked about is the one thing this command must not do by accident. So the
 * default is to report it, name its pid if the machine will say, and stop.
 */
async function stopUnlockedDevServerAsync(
  options: DevStopOptions,
  startedAt: number
): Promise<DevStopResultJson> {
  const port = options.port ?? null;
  const base: DevStopResultJson = {
    stopped: false,
    pid: null,
    port,
    url: null,
    lockHeld: false,
    signal: null,
    forced: false,
    reason: 'not-running',
    detail: 'no dev-server lock answered for this project, and nothing was listening for it',
    waitedMs: Date.now() - startedAt,
    followups: [],
  };

  if (port == null) {
    base.detail =
      'no dev-server lock answered for this project, so no dev server started by this CLI is running. Pass --port to look at a specific port for one started another way';
    return base;
  }

  const listener = await findPortListenerAsync(port);
  const isDevServer = await isExpoDevServerAsync(port);
  base.pid = listener?.pid ?? null;
  base.url = isDevServer ? `http://127.0.0.1:${port}` : null;

  if (listener == null && !isDevServer) {
    base.detail = `no dev-server lock answered for this project, and nothing is listening on port ${port}`;
    base.waitedMs = Date.now() - startedAt;
    return base;
  }

  // @ref llp/0005 §Stopping the dev server — both proofs, or nothing is killed.
  if (options.force && isDevServer && listener != null && looksLikeDevServerProcess(listener)) {
    const sent = await signalProcessAsync(listener.pid, options.signal);
    base.signal = sent.delivered ? options.signal : null;
    const gone = await waitForPortFreeAsync(port, options.timeoutMs);
    base.waitedMs = Date.now() - startedAt;
    if (gone) {
      base.stopped = true;
      base.forced = true;
      base.reason = null;
      base.detail = null;
      return base;
    }
    base.reason = 'still-running';
    base.detail = `${options.signal} was sent to ${listener.pid}, and port ${port} was still answering ${options.timeoutMs}ms later`;
    return base;
  }

  base.reason = 'foreign-dev-server';
  base.detail = [
    `port ${port} is`,
    isDevServer ? 'answering as an Expo dev server' : 'in use',
    listener != null ? `by pid ${listener.pid} (${listener.command})` : 'by a process this machine would not name',
    'and no lock answers for it, so it was not started by this CLI',
  ].join(' ');
  base.waitedMs = Date.now() - startedAt;
  return base;
}

/**
 * Send a signal to a pid, without letting a delivery failure become an exception.
 *
 * On Windows `process.kill` maps every signal onto an immediate terminate, and it reaches only the
 * process named — a dev server started through a batch shim has its bundler in a child that would
 * survive. `taskkill /T` covers the tree, so that is what is used there. It is best effort and
 * untested on that platform, which is why the result says whether the call was made rather than
 * whether it worked.
 */
export async function signalProcessAsync(
  pid: number,
  signal: NodeJS.Signals
): Promise<{ delivered: boolean; error?: string }> {
  if (process.platform === 'win32') {
    const result = await spawnCaptureAsync('taskkill', ['/PID', String(pid), '/T', '/F'], {
      timeoutMs: 5000,
    });
    return result.spawnError
      ? { delivered: false, error: result.spawnError.message }
      : { delivered: result.exitCode === 0, error: result.stderr.trim() || undefined };
  }
  try {
    process.kill(pid, signal);
    return { delivered: true };
  } catch (error: unknown) {
    return { delivered: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** Poll until the lock stops answering and the port stops answering, or the budget runs out. */
async function waitForStopAsync(lock: DevServerLockInfo, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    // Both, because they fail independently: the lock can be released while Metro is still
    // shutting its listener down, and a lock holder that dies without releasing leaves a socket
    // file that nothing answers on. "Stopped" is when neither answers.
    const [lockGone, portFree] = await Promise.all([
      readDevServerLockAsync(lock.projectRoot).then((info) => info == null),
      isPortFreeAsync(lock.port),
    ]);
    if (lockGone && portFree) {
      return true;
    }
    if (Date.now() + POLL_INTERVAL_MS >= deadline) {
      return false;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

/** Poll until nothing answers on a port. */
async function waitForPortFreeAsync(port: number, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (await isPortFreeAsync(port)) {
      return true;
    }
    if (Date.now() + POLL_INTERVAL_MS >= deadline) {
      return false;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

/** Whether nothing answers an HTTP request on the port. */
async function isPortFreeAsync(port: number): Promise<boolean> {
  try {
    await fetch(`http://127.0.0.1:${port}/status`, {
      signal: AbortSignal.timeout(400),
    });
    return false;
  } catch {
    return true;
  }
}

/**
 * Whether the port answers the way a Metro dev server answers.
 *
 * This is the first of the two proofs `--force` requires. It is about the *port*: something that
 * writes `packager-status:running` is a Metro dev server, whatever its command line says.
 */
export async function isExpoDevServerAsync(port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/status`, {
      signal: AbortSignal.timeout(800),
    });
    return (await response.text()).trim() === PACKAGER_STATUS_READY;
  } catch {
    return false;
  }
}

/**
 * Whether a listener's command line names a program that runs a dev server.
 *
 * This is the second of the two proofs, and it is about the *process*. Both are required because
 * each alone can be wrong in a way that ends with the wrong process killed: a `/status` answer
 * proves a dev server is there but not which pid owns it, and a pid lookup can race a port that
 * was closed and reopened between the two reads.
 */
export function looksLikeDevServerProcess(listener: PortListener): boolean {
  return /\b(node|expo|metro|bun|deno)\b/i.test(listener.command);
}

function buildFollowUps(report: DevStopResultJson): FollowUp[] {
  if (report.stopped) {
    return [
      {
        id: 'dev',
        command: 'npx exagent dev --yes',
        why: 'The dev server is stopped, so this is what starts one again when the app is needed.',
      },
    ];
  }
  if (report.reason === 'foreign-dev-server') {
    return [
      {
        id: 'status',
        command: 'npx exagent status --json',
        why: 'Reports which dev server this project would talk to, so the one on that port can be told apart from this project’s.',
      },
    ];
  }
  return [];
}

function printHumanReport(report: DevStopResultJson): void {
  const lines = [
    chalk`{bold Stopped} ${report.stopped ? chalk.green('yes') : chalk.red('no')}${
      report.forced ? chalk.dim(' · forced') : ''
    }`,
  ];
  if (report.pid != null) {
    lines.push(
      chalk`{bold Process} ${report.pid}${report.signal ? chalk.dim(` · sent ${report.signal}`) : chalk.dim(' · not signalled')}`
    );
  }
  if (report.url != null || report.port != null) {
    lines.push(
      chalk`{bold Dev server} ${report.url ?? `port ${report.port}`}${chalk.dim(
        report.lockHeld ? ' · via lock' : ' · no lock answered'
      )}`
    );
  }
  if (report.detail != null) {
    lines.push(chalk.dim(` ${report.detail}`));
  }
  lines.push(chalk`{bold Took} ${report.waitedMs}ms`);
  Log.log(lines.join('\n'));
}

/** The what / why / how for a dev server that is still running. */
function explainFailure(report: DevStopResultJson, options: DevStopOptions): string {
  if (report.reason === 'foreign-dev-server') {
    return [
      chalk.red(`The dev server on port ${report.port} was not stopped.`),
      `Why: ${report.detail}. Stopping a process this CLI did not start would be killing something nobody in this command asked about — a second project's dev server on that port is the ordinary case.`,
      `How: stop it where it was started, or run this command again with --force, which stops it only when the port answers as an Expo dev server ${report.pid != null ? `and pid ${report.pid} looks like one` : 'and its process can be identified'}.`,
    ].join('\n');
  }
  return [
    chalk.red(`The dev server is still running.`),
    `Why: ${report.detail}.`,
    `How: run this command again with a longer --timeout, or with --signal SIGKILL, which the process cannot decline. A dev server that ignores ${options.signal} is usually mid-shutdown rather than stuck.`,
  ].join('\n');
}
