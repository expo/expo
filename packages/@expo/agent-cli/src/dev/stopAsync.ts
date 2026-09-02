// @ref llp/0004-smart-start-and-project-state.rfc.md §Status
// @ref llp/0010-agent-conventions.rfc.md §Exit codes
// Stop this project's dev server.
//
// The friction this replaces is a shell incantation an agent has to compose and get right:
// `lsof -ti tcp:8081 | xargs kill`. Every part of it is a guess — which port, whether the pid on
// it is this project's dev server, whether SIGTERM was enough — and a wrong guess kills something
// the caller did not mean to.
//
// The lock already answers all of it. `src/devLock/` holds a socket for as long as an
// `@expo/agent-cli`-started dev server runs, and the line it answers with carries the wrapper's `pid`
// alongside the URL and port. Signalling that pid is enough for the whole tree: both spawn paths
// install forwarders for `SIGINT`/`SIGTERM` and pass them to the `expo start` child
// [observed — `src/utils/subprocess.ts`, `src/utils/expoCli.ts` `runExpoAsync`], so the wrapper
// takes Metro with it and releases the lock on the way out.
//
// The lock is also what makes the *negative* answer honest: a port that answers with no lock
// behind it is a dev server this CLI did not start, and the report says so instead of killing it.
//
// **The pid is the primary evidence that the stop worked; the port is secondary.** These answer two
// different questions — "is the process I signalled alive?" and "does something answer 8081?" — and
// this command used to require both before it would say the dev server had stopped. That is wrong
// whenever anything else is on the port, and the case that forces it is a split IPv4/IPv6 stack
// (llp/0005 §Stopping the app): the lock publishes `http://127.0.0.1:<port>`, so
// every check here is over IPv4, while a dev server that bound `::1` is a different listener on the
// same port number. A stranger on `127.0.0.1:8081` therefore kept `dev:stop` reporting
// `still-running` — exit 20 — about a process that was already gone, with a `How:` line offering
// `--signal SIGKILL` for a pid nothing could signal.

import chalk from 'chalk';

import { readDevServerLockAsync, type DevServerLockInfo } from '../devLock';
import { event as cliEvent } from '../events';
import { EXIT_OK, EXIT_OUTCOME_FAILED } from '../exitCodes';
import { followUpsEnabled, reportFollowUps, type FollowUp } from '../followups';
import * as Log from '../log';
import { PROGRAM_PREFIX } from '../programName';
import { PACKAGER_STATUS_READY } from '../runtime/waitReady';
import { spawnCaptureAsync } from '../utils/spawnCapture';
import { windowsTaskkillCommand } from '../utils/windowsShim';
import { debugEvent, event } from './events';
import { findPortListenerAsync, isPortInUseAsync, type PortListener } from './portListener';
import { isProcessAlive } from './processLiveness';
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
 * Which of `--force`'s two proofs did not hold.
 *
 * `--force` requires the same fact from two directions — the port answers as a Metro dev server,
 * and the process on the port is a program that runs one — because each alone can be wrong in a
 * way that ends with the wrong process killed (llp/0005 §Stopping the app).
 *
 * Reported because the refusal's own recovery used to be "run this command again with --force"
 * whether or not `--force` had been passed [observed — friction run 5, F48-1]. To a caller that
 * had just passed it, that is a next action that cannot work, and it says nothing about which
 * proof was missing — which is the only thing that decides what to do instead.
 */
export type DevStopForceRefusal =
  /** The port answered, but not with `packager-status:running`, so no Metro is proved to be there. */
  | 'not-a-dev-server'
  /** Something is listening and this machine would not name the process holding the port. */
  | 'unnamed-process'
  /** The process on the port runs a program that does not run a dev server. */
  | 'foreign-process';

/**
 * Machine shape of `@expo/agent-cli dev:stop --json`.
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
  /**
   * Whether a lock answered for **the target**: this CLI's dev server or a stranger's.
   *
   * False when this project holds a lock for a different port than `--port` named, because that
   * lock is not evidence about the port this run acted on (F60). The lock's own port is named in
   * {@link detail} instead.
   */
  lockHeld: boolean;
  /** Signal that was sent, or null when nothing was signalled. */
  signal: string | null;
  /** The dev server was killed after `--force`, rather than asked to stop. */
  forced: boolean;
  /**
   * Which of `--force`'s two proofs did not hold, or null.
   *
   * Non-null exactly when `--force` was passed and declined, so a caller can branch on the
   * missing proof instead of reading the sentence that names it.
   */
  forceRefusedBy: DevStopForceRefusal | null;
  /**
   * The process this command signalled was still alive when it finished.
   *
   * The **primary** evidence about the stop, and the one an agent should branch on: it is the only
   * fact that is about the thing the signal was sent to. False beside `stopped: false` means the
   * signal worked and something else — the lock, below — is what did not go away, so
   * `--signal SIGKILL` is not the recovery.
   */
  processStillRunning: boolean;
  /**
   * Something was still answering the port when this command finished.
   *
   * Secondary evidence, reported rather than acted on. True beside `stopped: true` is the split
   * IPv4/IPv6 stack of llp/0005 §Stopping the app, or simply a second project's
   * dev server that was there all along: the process this command signalled is gone, and the port
   * number it was using is in use by something else. A caller that cares which reads it here
   * instead of inferring it from an exit code that has nothing to say about it.
   */
  portStillAnswering: boolean;
  /** Why nothing was stopped. Null exactly when {@link stopped} is true. */
  reason: DevStopSkipReason | null;
  /** One sentence of detail for {@link reason}. Null exactly when {@link stopped} is true. */
  detail: string | null;
  /** How long the whole stop took, in milliseconds. */
  waitedMs: number;
  followups: FollowUp[];
}

export interface DevStopReportOptions {
  /**
   * Whether to print the report at all.
   *
   * False for a caller that is *part of* another command's answer, exactly as
   * `devDetachAsync` has it: `smoke` stops the dev server it started as the cleanup of a run that
   * prints one report, and under `--json` a second report printed into that stdout would make the
   * whole run unparseable. The `cli:dev_stop` event is emitted either way, so a suppressed report
   * is never a silent stop.
   */
  print?: boolean;
  /**
   * Handed the report, for a caller that has to say what happened in words of its own.
   *
   * The return value is one exit code, which is all a command needs and not enough for a caller
   * folding this into a bigger answer: `smoke`'s cleanup line names the URL it stopped and quotes
   * the detail when it could not, and neither of those is derivable from `20`.
   */
  onReport?: (report: DevStopResultJson) => void;
}

/**
 * Stop this project's dev server.
 *
 * @returns the exit code: `0` stopped, or nothing was running; `20` something is still there.
 */
export async function devStopAsync(
  projectRoot: string,
  options: DevStopOptions,
  { print = true, onReport }: DevStopReportOptions = {}
): Promise<number> {
  const startedAt = Date.now();
  const lock = await readDevServerLockAsync(projectRoot);

  // `--port` names the target, and a lock is only evidence about the port it holds.
  //
  // This used to be `lock ? locked : unlocked`, which meant `--port 8195` signalled the pid of the
  // dev server on 8190 and reported `Stopped yes` naming a port the caller never asked about
  // [observed — friction run 7, F60]. It is the one destructive verb in this surface, so a target
  // it was not given is the one thing it must never act on: when `--port` disagrees with the lock,
  // the lock is set aside and the port is answered for on its own evidence.
  // @ref llp/0021-honest-reports.rfc.md §How they show up
  const lockOwnsTarget = lock != null && (options.port == null || lock.port === options.port);
  debugEvent('stop_lock_read', {
    held: lock != null,
    pid: lock?.pid ?? null,
    ownsTarget: lockOwnsTarget,
  });

  const report =
    lock != null && lockOwnsTarget
      ? await stopLockedDevServerAsync(lock, options, startedAt)
      : await stopUnlockedDevServerAsync(options, startedAt, lock);

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

  const exitCode =
    report.stopped || report.reason === 'not-running' ? EXIT_OK : EXIT_OUTCOME_FAILED;
  onReport?.(report);

  // The event above is emitted whatever happens: a caller that suppresses the report is still
  // stopping a dev server, and the stream is how that is visible to anything watching.
  if (print) {
    if (options.json) {
      Log.log(JSON.stringify(report, null, 2));
    } else {
      printHumanReport(report);
    }
    if (exitCode !== EXIT_OK) {
      Log.error(explainFailure(report, options));
    }
    reportFollowUps('dev:stop', report.followups, { json: options.json });
  }
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
    forceRefusedBy: null,
    processStillRunning: false,
    portStillAnswering: false,
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

  const outcome = await waitForStopAsync(lock, options.timeoutMs);
  base.waitedMs = Date.now() - startedAt;
  base.processStillRunning = !outcome.processGone;
  base.portStillAnswering = !outcome.portFree;
  debugEvent('stop_outcome', outcome);

  // The two facts that are about the thing this command signalled. The port is not one of them.
  if (outcome.processGone && outcome.lockGone) {
    base.stopped = true;
    return base;
  }

  base.reason = 'still-running';
  base.detail = !outcome.processGone
    ? sent.delivered
      ? `${options.signal} was sent to ${lock.pid}, and that process was still running ${options.timeoutMs}ms later`
      : `${options.signal} could not be delivered to ${lock.pid} (${sent.error ?? 'no reason given'}), and that process is still running`
    : // The pid went and the lock did not. The socket is held by something, so the dev server this
      // project would be found at is not this command's to have stopped.
      `pid ${lock.pid} is gone, but this project's dev-server lock is still answering, so something else is holding it`;
  return base;
}

/**
 * No lock answered *for the target*. Either nothing is running, or something this CLI did not
 * start is.
 *
 * The two are told apart by the port, and the difference matters more than it looks: killing a
 * listener nobody asked about is the one thing this command must not do by accident. So the
 * default is to report it, name its pid if the machine will say, and stop.
 *
 * @param elsewhereLock a lock this project holds for a *different* port than `--port` named. It is
 * reported and never acted on: naming it is what tells a caller their own dev server is on another
 * port, and acting on it is F60.
 */
async function stopUnlockedDevServerAsync(
  options: DevStopOptions,
  startedAt: number,
  elsewhereLock: DevServerLockInfo | null = null
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
    forceRefusedBy: null,
    processStillRunning: false,
    portStillAnswering: false,
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

  // A null listener means one of two things — the port is quiet, or the port is busy and this
  // machine would not say by whom — and only the first is "nothing was running" (F72). The bind
  // attempt is what tells them apart, and it is only needed when nothing else has already answered.
  const inUse = isDevServer || listener != null || (await isPortInUseAsync(port));

  if (!inUse) {
    base.detail = `no dev-server lock answered for this project, and nothing is listening on port ${port}${lockElsewhereClause(elsewhereLock)}`;
    base.waitedMs = Date.now() - startedAt;
    return base;
  }

  // @ref llp/0005 §Stopping the app — both proofs, or nothing is killed.
  if (options.force && isDevServer && listener != null && looksLikeDevServerProcess(listener)) {
    const sent = await signalProcessAsync(listener.pid, options.signal);
    base.signal = sent.delivered ? options.signal : null;
    // The pid, again, rather than the port. `--force` proved *this process* was the dev server on
    // the port, so this process going away is what "forced" means; a port that keeps answering
    // afterwards is a second listener, and reporting a failed kill for it would be a lie about the
    // one thing this command did do.
    const outcome = await waitForForcedStopAsync(listener.pid, port, options.timeoutMs);
    base.waitedMs = Date.now() - startedAt;
    base.processStillRunning = !outcome.processGone;
    base.portStillAnswering = !outcome.portFree;
    if (outcome.processGone) {
      base.stopped = true;
      base.forced = true;
      base.reason = null;
      base.detail = null;
      return base;
    }
    base.reason = 'still-running';
    base.detail = `${options.signal} was sent to ${listener.pid}, and that process was still running ${options.timeoutMs}ms later`;
    return base;
  }

  base.reason = 'foreign-dev-server';
  // Which proof was missing, for a run that asked for `--force` and did not get it. Ordered by
  // which one is read first: a port that does not answer as a dev server settles it whatever the
  // process is, and an unnamed process is a different next step than a named foreign one.
  base.forceRefusedBy = options.force
    ? !isDevServer
      ? 'not-a-dev-server'
      : listener == null
        ? 'unnamed-process'
        : 'foreign-process'
    : null;
  // Two sentences, because they are two different facts and the old one blurred them: a dev server
  // this CLI did not start is not the same thing as a stranger on the port, and only the first is
  // something `--force` could ever stop.
  base.detail = isDevServer
    ? [
        `port ${port} is answering as an Expo dev server`,
        listener != null
          ? `run by pid ${listener.pid} (${listener.command})`
          : 'run by a process this machine would not name',
        `and no lock answers for it, so it was not started by this CLI`,
      ].join(' ') + lockElsewhereClause(elsewhereLock)
    : `no Expo dev server answered on port ${port}; ` +
      (listener != null
        ? `pid ${listener.pid} (${listener.command}) is listening and is not one`
        : `something is listening and is not one — this machine would not name the process holding the port`) +
      lockElsewhereClause(elsewhereLock);
  base.waitedMs = Date.now() - startedAt;
  return base;
}

/**
 * The clause that names this project's dev server when it is somewhere other than `--port`.
 *
 * Reported so that the caller who mistyped a port learns where their own dev server actually is,
 * rather than being told only that the port they named holds a stranger.
 */
function lockElsewhereClause(lock: DevServerLockInfo | null): string {
  return lock == null
    ? ''
    : `. This project's own dev-server lock is on port ${lock.port} (pid ${lock.pid}), which is not the port this run named — nothing there was signalled`;
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
    const result = await spawnCaptureAsync(
      windowsTaskkillCommand(),
      ['/PID', String(pid), '/T', '/F'],
      {
        timeoutMs: 5000,
      }
    );
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

/** What the three checks said the last time they were asked. */
interface StopOutcome {
  /** The pid the lock named no longer exists. The primary evidence that the signal worked. */
  processGone: boolean;
  /** The project's dev-server lock no longer answers, so nothing holds it. */
  lockGone: boolean;
  /** Nothing answered `/status` on the port. Secondary: the port is not the process. */
  portFree: boolean;
}

/**
 * Poll until the signalled process and the lock have both gone, or the budget runs out.
 *
 * The port is read every round and never gates the answer. It used to: "stopped" meant the lock and
 * the port had both gone quiet, which reads as caution and is a wrong answer whenever anything else
 * is on the port — including this CLI's own IPv4-only check meeting a listener the dev server never
 * knew about (llp/0005 §Stopping the app). The pid is what the signal was sent to,
 * so the pid is what says whether it worked.
 *
 * The lock stays in the condition because it is about this project rather than about the port
 * number: while it answers, another command would still be pointed at a dev server here.
 */
async function waitForStopAsync(lock: DevServerLockInfo, timeoutMs: number): Promise<StopOutcome> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const [lockGone, portFree] = await Promise.all([
      readDevServerLockAsync(lock.projectRoot).then((info) => info == null),
      isPortFreeAsync(lock.port),
    ]);
    const outcome = { processGone: !isProcessAlive(lock.pid), lockGone, portFree };
    if (outcome.processGone && outcome.lockGone) {
      return outcome;
    }
    if (Date.now() + POLL_INTERVAL_MS >= deadline) {
      return outcome;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

/** Poll until the pid `--force` signalled has gone, or the budget runs out. */
async function waitForForcedStopAsync(
  pid: number,
  port: number,
  timeoutMs: number
): Promise<{ processGone: boolean; portFree: boolean }> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const processGone = !isProcessAlive(pid);
    if (processGone) {
      return { processGone, portFree: await isPortFreeAsync(port) };
    }
    if (Date.now() + POLL_INTERVAL_MS >= deadline) {
      return { processGone, portFree: await isPortFreeAsync(port) };
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
    const followups: FollowUp[] = [];
    // First, because it contradicts the line above it: the dev server stopped and the port is
    // still busy, and an agent that reads only "Stopped yes" will start the next one into a
    // collision. This command run again against the port is what names whose listener it is —
    // the unlocked path reports its pid and its command line.
    if (report.portStillAnswering && report.port != null) {
      followups.push({
        id: 'dev-stop-port',
        command: `${PROGRAM_PREFIX} dev:stop --port ${report.port}`,
        why: `Port ${report.port} still answers, and it is not the process that was just stopped. This asks what is on it and names the pid.`,
      });
    }
    followups.push({
      id: 'dev',
      command: `${PROGRAM_PREFIX} dev --yes`,
      why: 'The dev server is stopped, so this is what starts one again when the app is needed.',
    });
    return followups;
  }
  if (report.reason === 'foreign-dev-server') {
    return [
      {
        id: 'status',
        command: `${PROGRAM_PREFIX} status --json`,
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
  // Said out loud on the success path too, because "Stopped yes" and a port that still answers is
  // the one combination a reader would otherwise take for a contradiction.
  if (report.stopped && report.portStillAnswering && report.port != null) {
    lines.push(
      chalk`{bold Port} ${report.port}${chalk.dim(' · still answering, by something else')}`
    );
    lines.push(
      chalk.dim(
        ` The process this command signalled is gone. Another listener has that port number — a second project's dev server, or one on the other IP stack, since this check is over 127.0.0.1 and a listener on ::1 is a different socket.`
      )
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
    // `url` is set on this path exactly when the port answered `packager-status:running`, which is
    // the difference between "someone else's dev server" and "not a dev server at all". They need
    // different advice: `--force` can stop the first and will always decline the second.
    const answeredAsDevServer = report.url != null;
    return [
      chalk.red(
        answeredAsDevServer
          ? `The dev server on port ${report.port} was not stopped.`
          : `Nothing was stopped on port ${report.port}.`
      ),
      answeredAsDevServer
        ? `Why: ${report.detail}. Stopping a process this CLI did not start would be killing something nobody in this command asked about — a second project's dev server on that port is the ordinary case.`
        : `Why: ${report.detail}. This command stops Expo dev servers, so it will not signal a process that has not shown it is one.`,
      report.forceRefusedBy
        ? forceRefusedHow(report, report.forceRefusedBy)
        : answeredAsDevServer
          ? `How: stop it where it was started, or run this command again with --force, which stops it only when the port answers as an Expo dev server ${report.pid != null ? `and pid ${report.pid} looks like one` : 'and its process can be identified'}.`
          : `How: stop whatever holds that port where it was started, or name the port your dev server is really on with --port. --force would be declined here for the same reason, and "${PROGRAM_PREFIX} status --json" reports which dev server this project would talk to.`,
    ].join('\n');
  }
  // Two failures wear this reason, and only one of them is answered by a bigger hammer. Sending
  // SIGKILL to a pid that is already gone is a next action that cannot work, which is the same
  // mistake the `--force` refusal used to make [friction run 5, F48-1].
  if (!report.processStillRunning) {
    return [
      chalk.red(`This project's dev-server lock is still answering.`),
      `Why: ${report.detail}. The signal did its job — pid ${report.pid} is gone — so what is left is a second holder of the lock, which is what happens when this project has two dev servers running and only one of them was this one.`,
      `How: run "${PROGRAM_PREFIX} status --json" to see which dev server this project would now talk to, and stop that one where it was started. Nothing here is waiting on a longer --timeout, and --signal SIGKILL has nothing left to signal.`,
    ].join('\n');
  }
  return [
    chalk.red(`The dev server is still running.`),
    `Why: ${report.detail}.`,
    `How: run this command again with a longer --timeout, or with --signal SIGKILL, which the process cannot decline. A dev server that ignores ${options.signal} is usually mid-shutdown rather than stuck.`,
  ].join('\n');
}

/**
 * The `How:` line for a `--force` that was passed and declined.
 *
 * It never names `--force` as the recovery, because the caller already passed it — the old line
 * did, which is a next action guaranteed to fail again [observed — friction run 5, F48-1]. What it
 * names instead is the proof that was missing and the one thing that would supply it.
 */
function forceRefusedHow(report: DevStopResultJson, refusal: DevStopForceRefusal): string {
  const port = report.port;
  switch (refusal) {
    case 'not-a-dev-server':
      return `How: --force was passed and declined, because the first of its two proofs did not hold — port ${port} answered, but not with "${PACKAGER_STATUS_READY}", so nothing has shown a Metro dev server is on it. --force never kills a listener on that evidence. Stop whatever is on the port where it was started, or name the right port with --port.`;
    case 'unnamed-process':
      return `How: --force was passed and declined, because the second of its two proofs did not hold — the port answers as an Expo dev server, and this machine named no process holding it, so there is no pid to signal. Run "lsof -ti tcp:${port}" yourself to see whether your user owns it; a listener owned by another user is not visible here.`;
    case 'foreign-process':
      return `How: --force was passed and declined, because the second of its two proofs did not hold — the program pid ${report.pid} runs, named above, is not one that runs a dev server, so the pid on the port and the dev server answering on it disagree. That usually means something in front of a dev server elsewhere: stop it where it was started, or point this command at the real port with --port.`;
  }
}
