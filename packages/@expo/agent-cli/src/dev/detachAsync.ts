// @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization
// @ref llp/0010-agent-conventions.rfc.md §Exit codes
// `@expo/agent-cli dev --detach`: start the dev server and give the terminal back.
//
// The friction this answers is the plainest one in the CLI. `@expo/agent-cli dev` runs the dev server in
// the foreground and says nothing about it, so the first thing a driving agent does is burn a
// command timeout waiting for a command that never returns, and every step after it — `dev:wait`,
// `navigate`, `runtime:errors` — needs a shell the dev server is not holding [F46, friction run 4].
//
// What is new here is only the *spawn*: the child is `@expo/agent-cli dev` again, unchanged, with its
// output pointed at a file. Everything that makes the dev server discoverable afterwards already
// exists — the lock publishes its port (`src/devLock/`), `dev:wait` reports its readiness, and
// `dev:stop` signals the pid the lock names. This is the reason the child is this CLI and not
// `expo start` directly: the lock is taken by the wrapper, so a detached run has to *be* a wrapper.
//
// **One detached dev server per project.** The lock is asked before anything is spawned, and a
// project that already has one is reported rather than given a second. Two dev servers for one
// project is a thing people do on purpose in two terminals; two *detached* ones is a process
// nobody can find, because only one of them can hold the lock that names it.

import { spawn } from 'child_process';
import fs from 'fs';

import { readDevServerLockAsync, type DevServerLockInfo } from '../devLock';
import { event as cliEvent } from '../events';
import { EXIT_OUTCOME_FAILED } from '../exitCodes';
import { followUpsEnabled, reportFollowUps, type FollowUp } from '../followups';
import * as Log from '../log';
import { needsHumanErrorFrom, needsHumanOf } from '../needsHuman/error';
import { findNeedsHumanScenario } from '../needsHuman/registry';
import { PROGRAM_PREFIX } from '../programName';
import { wrapUntrustedAppOutput } from '../runtime/untrusted';
import { waitForBundlerReadyAsync, type BundlerReadyResult } from '../runtime/waitReady';
import { requestsTunnel } from '../start/followUps';
import { CommandError } from '../utils/errors';
import { fetchAdvertisedUrlAsync, readDevServerLogSync } from './advertisedUrl';
import {
  parseDetachedChildPhase,
  parseDetachedChildVerdict,
  VERDICT_LOG_LINES,
  type DetachedChildPhase,
  type DetachedChildVerdict,
} from './childVerdict';
import { event } from './events';
import { openDetachedLogSync, readDetachedLogSync } from './logFile';
import { parsePortMove, type PortMove } from './portCollision';
import type { DevOptions } from './resolveOptions';

/** How long the parent waits for the detached child to publish its lock. */
export const DEFAULT_DETACH_TIMEOUT_MS = 120_000;

/** How often the lock is asked while the parent waits for it. */
const LOCK_POLL_INTERVAL_MS = 200;

/** How many lines of the child's log a failure quotes back. */
const FAILURE_LOG_LINES = 20;

/**
 * Machine shape of `@expo/agent-cli dev --detach --json`.
 *
 * @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — one JSON object on stdout,
 * every key always present, and a fact the run does not have is null.
 */
export interface DevDetachResultJson {
  /** Origin the dev server listens on. */
  url: string;
  port: number;
  /** PID of the detached `@expo/agent-cli` process, which is what `dev:stop` signals. */
  pid: number;
  /** Where its output is being written. */
  logFile: string;
  /**
   * Whether the bundler answered `/status`. Null when `--wait-ready` was not asked for, which is
   * the difference between "not ready" and "not asked".
   */
  ready: boolean | null;
  /** Whether the dev server serves this project, when readiness was checked. */
  projectRootMatched: boolean | null;
  /** A dev server was already running for this project, so nothing was started. */
  alreadyRunning: boolean;
  /**
   * Which half of its plan the detached run is in: `building`, or `serving`.
   *
   * @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization
   * **F125.** {@link url} is where the dev server *will* listen, not always where one is: the lock
   * is published when the dev-server step starts, and for `expo run:ios` or `expo run:android` that
   * step builds and installs the app before it serves anything. So a plan whose compiler is still
   * running publishes a port nothing answers on, and a caller that reads {@link url} alone goes
   * looking for a dev server that is ten minutes away. `serving` whenever nothing says otherwise.
   */
  phase: 'building' | 'serving';
  /**
   * The port this run was moved off, and the one it landed on. Null when it did not move.
   *
   * A detached run does its port retry in the child, so the move was reported on a stream nobody
   * was watching: the parent printed `port: 8210` and said nothing about 8081 having been asked
   * for, and every command and URL a caller had already written still named the old port
   * [observed — friction run 5, F48-4]. `from` is null when the Expo CLI did not name the busy
   * port, which it does not always.
   */
  portMoved: PortMove | null;
  /**
   * The tunnel origin this run is reachable at, or null.
   *
   * Non-null only for a run started with `--tunnel` whose dev server has advertised a host. It is
   * the address a device off this machine uses, and {@link url} — where it listens here — is not:
   * a phone cannot open `http://127.0.0.1:8081`, and neither can a cloud simulator. The tunnel
   * comes up **after** the bundler answers, so this run waits for it rather than reporting the
   * local address as though it were the answer.
   *
   * @see llp/0005-runtime-loop-tools.rfc.md §Where a device reaches the dev server
   */
  tunnelUrl: string | null;
  /** How long the whole thing took, in milliseconds. */
  waitedMs: number;
  followups: FollowUp[];
}

/** The argv of the detached child, as a value a test can assert without spawning anything. */
export interface DetachSpawn {
  /** Executable to run: this process' own Node. */
  command: string;
  args: string[];
}

/**
 * The command line the detached child is started with.
 *
 * Pure, and exported for the test table, because it is the half of this file that can be wrong in a
 * way nothing else notices: a flag left on the child's command line changes what the *dev server*
 * does, and the parent would report success either way.
 *
 * Three flags are stripped, and each for its own reason:
 *
 * - `--detach` — the child is the run, so passing it on would detach a detached run, forever.
 * - `--wait-ready` — the readiness wait is the parent's, and the child has nobody to report it to.
 * - `--json` — the parent owns stdout and prints the one object of this run. In the child it would
 *   also switch the plan's subprocess output to `capture`, which is exactly the output the log
 *   file exists to hold.
 *
 * @param binPath the `@expo/agent-cli` entry script, i.e. this process' own `process.argv[1]`.
 */
export function buildDetachSpawn(binPath: string, argv: string[]): DetachSpawn {
  const dropped = new Set(['--detach', '--wait-ready', '--json']);
  return {
    command: process.execPath,
    args: [binPath, 'dev', ...argv.filter((arg) => !dropped.has(arg))],
  };
}

export interface DevDetachOptions {
  /**
   * Whether to print the report at all.
   *
   * False for a caller that is *part of* another command's answer: `@expo/agent-cli smoke` starts a
   * dev server as one phase of eight, and under `--json` its stdout is one object — a second report
   * printed into it would make the whole run unparseable, which is the failure llp/0010 §The
   * `--json` error envelope records for `dev` itself. The `cli:dev_detach` event is emitted either
   * way, so a suppressed report is never a silent start.
   */
  print?: boolean;
}

/**
 * Start the dev server in a process of its own, and report where it landed.
 *
 * @returns the exit code: always `0`, because a detached server that came up — or was already
 * up — is the outcome asked for. Everything else throws.
 * @throws {CommandError} when the child exited before publishing its lock, or the wait ran out.
 */
export async function devDetachAsync(
  projectRoot: string,
  options: DevOptions,
  { print = true }: DevDetachOptions = {}
): Promise<number> {
  const startedAt = Date.now();

  // Asked before anything is spawned. A second detached dev server for one project cannot hold the
  // lock, so nothing would be able to find it or stop it afterwards.
  const running = await readDevServerLockAsync(projectRoot);
  if (running) {
    return reportDetached(projectRoot, options, {
      lock: running,
      alreadyRunning: true,
      ready: null,
      projectRootMatched: null,
      startedAt,
      print,
      // Whatever the dev server that is already up advertised. Nothing is waited for here: this
      // run started nothing, so there is no tunnel of its own on its way.
      tunnelUrl: await currentTunnelUrlAsync(projectRoot, running.url),
    });
  }

  const { logFile, fd } = openDetachedLogSync(projectRoot);
  const { command, args } = buildDetachSpawn(resolveBinPath(), options.detachArgv);

  event('detach_spawn', { logFile, argv: args });
  const child = spawn(command, args, {
    cwd: projectRoot,
    // Its own process group and session, so closing this terminal does not take the dev server
    // with it — which is the whole point of detaching.
    detached: true,
    // Both streams into the log. `ignore` on stdin, because a detached process has no terminal to
    // read one from, and an inherited stdin would keep this shell attached to it.
    stdio: ['ignore', fd, fd],
    env: process.env,
  });
  // The child owns the file now; a descriptor left open here would keep the parent alive.
  fs.closeSync(fd);
  child.unref();

  let childExit: { code: number | null; signal: NodeJS.Signals | null } | null = null;
  child.once('exit', (code, signal) => {
    childExit = { code, signal };
  });
  child.once('error', () => {
    childExit = { code: null, signal: null };
  });

  const lock = await waitForLockAsync(projectRoot, {
    timeoutMs: options.detachTimeoutMs,
    hasExited: () => childExit != null,
  });
  if (!lock) {
    throw notStartedError(
      projectRoot,
      logFile,
      childExit,
      child.pid ?? null,
      Date.now() - startedAt
    );
  }

  let ready: boolean | null = null;
  let projectRootMatched: boolean | null = null;
  if (options.waitReady) {
    // The same wait `dev:wait` performs, and for the same reason: `/status` answers only once the
    // bundler has finished, so the request itself is the wait.
    const result = await waitForBundlerReadyAsync(lock.url, {
      timeoutMs: Math.max(1000, options.detachTimeoutMs - (Date.now() - startedAt)),
      projectRoot,
    });
    ready = result.ready;
    projectRootMatched = result.projectRootMatched;
    if (!result.ready) {
      // @ref ./childVerdict.ts §parseDetachedChildPhase — F125. The child's own log says which half
      // of its plan it is in, and a plan that is compiling has not started a dev server for this
      // report to describe.
      throw notReadyError(lock, logFile, result, readChildPhaseSync(projectRoot));
    }
  }

  const hasExited = () => childExit != null;
  const tunnelUrl = await waitForTunnelUrlAsync(projectRoot, options, hasExited);

  // The last thing before anything is claimed. Everything above is a fact about a moment that has
  // passed: the lock answered, the bundler answered, the tunnel wait ran — and a child that died in
  // between left the caller with `Bundler ready` and exit 0 for a dev server that was gone
  // [observed — friction run 7, F61; live staging, S4]. `ready: true` is only ever printed for a
  // process that is alive and a `/status` that still answers, here, now.
  // @ref llp/0021-honest-reports.rfc.md §The rules
  const phase = readChildPhaseSync(projectRoot);
  let verdict = readChildVerdictSync(projectRoot);
  let failure = resolveDetachFailure({
    exited: hasExited(),
    verdict,
    statusAnswering: ready === true ? await isBundlerAnsweringAsync(lock.url) : null,
  });

  // …and "here, now" was still not enough for one shape of run. @ref
  // llp/0021-honest-reports.rfc.md §The rules — **F140**. A step that opens the app
  // has work outstanding when the bundler answers, and the macOS Automation refusal that ends it
  // arrives a quarter of a second later — after every check above has passed. So the claim is held
  // open for a moment and the same three facts are asked again.
  if (failure == null && needsOpenPlatformGrace({ ready, phase })) {
    const grace = await watchOpenPlatformGraceAsync(projectRoot, lock.url, {
      hasExited,
      budgetMs: Math.min(
        OPEN_PLATFORM_GRACE_MS,
        // Bounded by the budget the caller gave the whole run, never beyond it: a `--wait-ready`
        // that has already spent its timeout must not spend a second one here.
        Math.max(0, options.detachTimeoutMs - (Date.now() - startedAt))
      ),
      // Only a run that waited for the bundler may be failed on the bundler.
      watchStatus: ready === true,
    });
    failure = grace.failure;
    verdict = grace.verdict ?? verdict;
  }

  if (failure) {
    throw detachFailureError(failure, { projectRoot, lock, logFile, verdict, childExit });
  }

  return reportDetached(projectRoot, options, {
    lock,
    alreadyRunning: false,
    ready,
    projectRootMatched,
    startedAt,
    print,
    tunnelUrl,
    phase,
  });
}

/**
 * How long a readiness claim is held open when the plan's dev-server step also opens the app.
 *
 * @ref llp/0021-honest-reports.rfc.md §The rules — **F140.**
 *
 * The number is measured rather than chosen. `expo start --go --ios` against an unauthorized machine
 * answered `/status` at 486ms, 448ms and 445ms and the process was gone at 701ms, 700ms and 708ms —
 * a gap of 215ms, 252ms and 263ms [observed — 2026-08-28, three runs against
 * `friction/run9/livecheck`, macOS Automation permission denied]. This is roughly six times the
 * widest of those, which is the margin a cold simulator's slower `ensureExpoGoAsync` needs.
 *
 * **It narrows the window; it does not close it.** A rejection that lands after this has expired
 * still leaves the caller with `Bundler ready`, because the Expo CLI emits no signal for "the app
 * opened" and there is nothing further to wait *for*. What the grace buys is that the shape the
 * walk hit three times in a row is now the shape that is caught.
 */
export const OPEN_PLATFORM_GRACE_MS = 1500;

/** How often the child is asked again while that grace runs. */
const OPEN_PLATFORM_POLL_MS = 100;

/**
 * Whether this run's claim is re-checked before it is printed.
 *
 * Pure, and exported, for the same reason {@link resolveDetachFailure} is: the cost of the grace is
 * paid by real seconds of a real caller's time, so which runs pay it has to be readable in one
 * place and assertable without a second process.
 *
 * Two conditions, and each excludes runs the grace could only slow down. The plan has to be
 * **serving** — a plan still compiling has started no dev server. And the dev-server step has to be
 * one that **opens the app**, which is where the late rejection comes from; a plan that opens
 * nothing has none on its way and pays nothing.
 *
 * **`ready === false` is the only readiness this declines**, and dropping the rest of that
 * condition is the correction of 2026-09-03 (@ref llp/0021 §The rules). It used to require
 * `ready === true`, on the reasoning that a run which asked for no readiness claims nothing. That
 * reasoning was wrong about what this command prints: `dev --detach --ios` reports
 * `Dev server <url> · detached` over a pid and exits 0, and live that pid was gone with nothing
 * listening on that URL inside a second — the same macOS Automation refusal F140 is about, on the
 * same plan step, caught only when `--wait-ready` was also passed [observed — macOS 25.5, no
 * Automation grant, 2026-09-03]. The hazard is a property of the plan step, not of the flag. A
 * `false` still declines: that run has already failed, and a grace on top would only delay it.
 */
export function needsOpenPlatformGrace({
  ready,
  phase,
}: {
  ready: boolean | null;
  phase: DetachedChildPhase;
}): boolean {
  return ready !== false && phase.phase === 'serving' && phase.opensPlatform;
}

/**
 * Ask the three facts again for a while, and report the worst answer the window held.
 *
 * The **first** failure is what the run is reported as, and the loop keeps going after it for one
 * reason: the two processes fail in order. `expo start` dies first, so `/status` stops answering
 * while the wrapper around it is still classifying the failure and writing its handoff — and a
 * report that stopped at the first "not answering" would hand back "the dev server stopped
 * answering" for a stop that has a named scenario, an "Ask the user" line and exit 7 waiting a
 * hundred milliseconds behind it. So a needs-human verdict ends the wait and anything else does not.
 */
async function watchOpenPlatformGraceAsync(
  projectRoot: string,
  url: string,
  {
    hasExited,
    budgetMs,
    watchStatus,
  }: {
    hasExited: () => boolean;
    budgetMs: number;
    /**
     * Whether `/status` is one of the facts this window may fail a run on.
     *
     * False for a run that claimed no readiness, and that is what makes the widened grace safe
     * (@ref ./detachAsync §needsOpenPlatformGrace, 2026-09-03). Such a run never waited for the
     * bundler, so a bundler that has not answered *yet* is the ordinary state of a first compile
     * and not a failure — and `resolveDetachFailure` turns a `false` there into `not-answering`.
     * The two facts that are left are conclusive whatever readiness was claimed: a handoff block in
     * the log, and a child that is gone. Both are what the refusal this grace exists for produces.
     */
    watchStatus: boolean;
  }
): Promise<{ failure: DetachFailureKind | null; verdict: DetachedChildVerdict | null }> {
  const deadline = Date.now() + budgetMs;
  let verdict = readChildVerdictSync(projectRoot);
  let failure: DetachFailureKind | null = null;
  while (Date.now() < deadline) {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(OPEN_PLATFORM_POLL_MS, deadline - Date.now()))
    );
    verdict = readChildVerdictSync(projectRoot);
    const seen = resolveDetachFailure({
      exited: hasExited(),
      verdict,
      statusAnswering: watchStatus ? await isBundlerAnsweringAsync(url) : null,
    });
    if (seen === 'needs-human') {
      return { failure: seen, verdict };
    }
    failure ??= seen;
  }
  return { failure, verdict };
}

/** Why a detached run that had come up is not something this command may report success for. */
export type DetachFailureKind =
  /** The child stopped at a step only a person can complete, and said which. */
  | 'needs-human'
  /** The child is gone, and its log holds no handoff. */
  | 'child-exited'
  /** The child is alive and the bundler that had answered `/status` no longer does. */
  | 'not-answering';

/** What the checks said at the moment the report was about to be printed. */
export interface DetachCheck {
  /** The child process this run spawned has exited. */
  exited: boolean;
  /** The child's own conclusion, read out of its log. */
  verdict: DetachedChildVerdict | null;
  /**
   * Whether `/status` still answered.
   *
   * Null when readiness was never established — a run without `--wait-ready` claims nothing about
   * the bundler, so a bundler that is still working is not a failure of this run.
   */
  statusAnswering: boolean | null;
}

/**
 * Whether a detached run may be reported as a success.
 *
 * Pure, and exported, because it is the whole of the F61 fix: three facts in, one verdict out, and
 * every combination testable without a second process.
 */
export function resolveDetachFailure({
  exited,
  verdict,
  statusAnswering,
}: DetachCheck): DetachFailureKind | null {
  // The handoff block is written by `logCmdError` and by nothing else, so a log that has one is the
  // log of a process on its way out — conclusive whether or not its exit has been observed yet.
  if (verdict?.scenario != null) {
    return 'needs-human';
  }
  if (exited) {
    return 'child-exited';
  }
  if (statusAnswering === false) {
    return 'not-answering';
  }
  return null;
}

/** One `/status` probe: whether the bundler that had answered still does. */
async function isBundlerAnsweringAsync(url: string): Promise<boolean> {
  const result = await waitForBundlerReadyAsync(url, { timeoutMs: LIVENESS_PROBE_TIMEOUT_MS });
  return result.ready;
}

/** How long the final `/status` probe may take. Short: the bundler already answered once. */
const LIVENESS_PROBE_TIMEOUT_MS = 2000;

/** The child's verdict, read out of the log this run opened. */
function readChildVerdictSync(projectRoot: string): DetachedChildVerdict | null {
  const read = readDetachedLogSync(projectRoot, VERDICT_LOG_LINES);
  return read == null ? null : parseDetachedChildVerdict(read.lines);
}

/**
 * Which half of its plan the child is in, read out of the same log.
 *
 * `PHASE_LOG_LINES` rather than the verdict's window: the plan table is printed *first*, and a
 * `run:*` step writes thousands of lines of compiler output over it. A log this run truncated is
 * still short at the top, and a window that misses the table reads as `serving`, which is the
 * wording this has always had.
 */
function readChildPhaseSync(projectRoot: string): DetachedChildPhase {
  const read = readDetachedLogSync(projectRoot, PHASE_LOG_LINES);
  return read == null
    ? { phase: 'serving', step: null, opensPlatform: false }
    : parseDetachedChildPhase(read.lines);
}

/**
 * The error for a detached run whose dev server is not there to be reported.
 *
 * Two exit codes, and the difference is the child's own: a stop only a person can complete is
 * `EXIT_NEEDS_HUMAN` with the scenario the child named, because the recovery is not another
 * command. Everything else is `EXIT_OUTCOME_FAILED` — the CLI worked and the dev server did not
 * come up — with the child's log quoted as what it is: output of another program.
 */
function detachFailureError(
  kind: DetachFailureKind,
  {
    projectRoot,
    lock,
    logFile,
    verdict,
    childExit,
  }: {
    projectRoot: string;
    lock: DevServerLockInfo;
    logFile: string;
    verdict: DetachedChildVerdict | null;
    childExit: { code: number | null; signal: NodeJS.Signals | null } | null;
  }
): CommandError {
  if (kind === 'needs-human' && verdict?.scenario != null) {
    const scenario = findNeedsHumanScenario(verdict.scenario);
    const message = [
      `The detached dev server stopped at a step only a person can complete, so there is no dev server on ${lock.url}.`,
      `Why: the run was started in a process of its own, and that process ran its plan and stopped. This is its own report of why, from ${logFile}:`,
      wrapUntrustedAppOutput(verdict.message),
    ].join('\n');
    return scenario
      ? needsHumanErrorFrom(needsHumanOf(scenario, { detectedBy: 'detached-child-log' }), {
          message,
          code: 'DEV_DETACH_NEEDS_HUMAN',
        })
      : new CommandError('DEV_DETACH_NEEDS_HUMAN', message);
  }

  const error = new CommandError(
    kind === 'child-exited' ? 'DEV_DETACH_DIED' : 'DEV_DETACH_NOT_ANSWERING',
    [
      kind === 'child-exited'
        ? `The detached dev server is not running any more: the process this command started (pid ${lock.pid}) exited${
            childExit?.signal
              ? ` on ${childExit.signal}`
              : childExit?.code != null
                ? ` with code ${childExit.code}`
                : ''
          } before this command could report it.`
        : `The dev server on ${lock.url} stopped answering before this command could report it.`,
      `Why: a detached run is two processes, and only this one is being read. The bundler answered while the other one was starting, and it is not there now — so "ready" would be a claim about a moment that has passed.`,
      `How: read what it printed with "${PROGRAM_PREFIX} dev:logs" (the file is ${logFile}), fix what it names, and start it again with "${PROGRAM_PREFIX} dev --detach --wait-ready". Running "${PROGRAM_PREFIX} dev --yes" in this terminal shows the same start in the foreground, which is the quickest way to watch it fail.${logTail(projectRoot)}`,
    ].join('\n')
  );
  error.exitCode = EXIT_OUTCOME_FAILED;
  error.suggestedCommand = `${PROGRAM_PREFIX} dev:logs`;
  return error;
}

/**
 * How long a `--tunnel` run waits for its dev server to say where the tunnel is.
 *
 * The tunnel is established after the bundler answers `/status`, so `--wait-ready` returning is not
 * the same as the tunnel being up — a scripted `dev --detach --tunnel --wait-ready` followed by
 * `navigate --print-url` used to land in that gap and get the address of *this machine* with no
 * note that a tunnel was on its way [observed — live, 2026-08-25]. Bounded, because a tunnel that
 * does not come up must not hold a dev server that did: the run reports `tunnelUrl: null` and the
 * log says why.
 */
export const TUNNEL_URL_WAIT_MS = 20_000;

/** How often the log is re-read while that wait runs. */
const TUNNEL_URL_POLL_MS = 250;

/** The tunnel this project's dev server currently advertises, or null. */
function currentTunnelUrlSync(projectRoot: string): string | null {
  const captured = readDevServerLogSync(projectRoot);
  return captured?.advertised?.hostType === 'tunnel' ? captured.advertised.url : null;
}

/**
 * The tunnel host, from the log or from the dev server itself.
 *
 * The log is asked first because it costs nothing, and because `Waiting on <url>` is the dev
 * server's own announcement. It is not always there: a detached `--tunnel` run's log held no host
 * at all while the tunnel was up [observed — live staging, 2026-08-26, S3]. The manifest of the dev
 * server this run already has a lock for carries the same address, one request away.
 */
async function currentTunnelUrlAsync(
  projectRoot: string,
  devServerUrl: string
): Promise<string | null> {
  const fromLog = currentTunnelUrlSync(projectRoot);
  if (fromLog != null) {
    return fromLog;
  }
  const advertised = await fetchAdvertisedUrlAsync(devServerUrl);
  return advertised?.hostType === 'tunnel' ? advertised.url : null;
}

/**
 * Wait for the tunnel URL, but only for a run that asked for one.
 *
 * A run with no `--tunnel` has nothing to wait for and pays nothing: the whole cost of this is
 * paid by the runs it is for.
 *
 * `hasExited` ends the wait early, because a tunnel cannot arrive from a process that is gone —
 * and this is the wait the child died inside of while the parent went on to report `ready: true`
 * (F61, S4).
 */
async function waitForTunnelUrlAsync(
  projectRoot: string,
  options: DevOptions,
  hasExited: () => boolean = () => false
): Promise<string | null> {
  if (!requestsTunnel(options.expoArgs)) {
    return null;
  }
  const lock = await readDevServerLockAsync(projectRoot);
  const deadline = Date.now() + TUNNEL_URL_WAIT_MS;
  for (;;) {
    const url =
      lock == null
        ? currentTunnelUrlSync(projectRoot)
        : await currentTunnelUrlAsync(projectRoot, lock.url);
    if (url != null || hasExited() || Date.now() >= deadline) {
      return url;
    }
    await new Promise((resolve) => setTimeout(resolve, TUNNEL_URL_POLL_MS));
  }
}

/** Print the report of a detached run, in whichever form was asked for. */
function reportDetached(
  projectRoot: string,
  options: DevOptions,
  {
    lock,
    alreadyRunning,
    ready,
    projectRootMatched,
    startedAt,
    print,
    tunnelUrl,
    phase,
  }: {
    lock: DevServerLockInfo;
    alreadyRunning: boolean;
    ready: boolean | null;
    projectRootMatched: boolean | null;
    startedAt: number;
    print: boolean;
    tunnelUrl: string | null;
    /**
     * The phase the caller already read, when it read one.
     *
     * The whole log is scanned for it (`PHASE_LOG_LINES`), so a run that has just asked the question
     * to decide whether to hold its claim open (F140) hands the answer over rather than paying for
     * a second scan of a log a compiler may have written thousands of lines into.
     */
    phase?: DetachedChildPhase;
  }
): number {
  const report: DevDetachResultJson = {
    url: lock.url,
    port: lock.port,
    pid: lock.pid,
    // The path only when the file is there. A dev server that was already running may have been
    // started attached, and then its output went to somebody's terminal and there is no log.
    logFile: readDetachedLogSync(projectRoot, 0)?.logFile ?? '',
    ready,
    projectRootMatched,
    alreadyRunning,
    // Read from the child's own log, which is the only channel it has to this process (F125 and
    // F48-4 both). The phase is read even for a run that started nothing: the question "is this
    // project's dev server listening" is the same question whoever started it.
    phase: (phase ?? readChildPhaseSync(projectRoot)).phase,
    portMoved: alreadyRunning ? null : readPortMoveSync(projectRoot),
    tunnelUrl,
    waitedMs: Date.now() - startedAt,
    followups: [],
  };
  report.followups = followUpsEnabled(options.followups) ? detachFollowUps(report) : [];

  cliEvent('dev_detach', {
    url: report.url,
    port: report.port,
    pid: report.pid,
    ready: report.ready,
    alreadyRunning: report.alreadyRunning,
    phase: report.phase,
    // The port that was asked for, so an agent reading only the stream sees the same fact the
    // report carries rather than a port it has no way to question.
    portMovedFrom: report.portMoved?.from ?? null,
    tunnelUrl: report.tunnelUrl,
  });

  // The event above is emitted whatever happens: a caller that suppresses the report is still
  // starting a dev server, and the stream is how that is visible to anything watching.
  if (print) {
    if (options.json) {
      Log.log(JSON.stringify(report, null, 2));
    } else {
      printHumanReport(report);
    }
    reportFollowUps('dev', report.followups, { json: options.json });
  }
  return 0;
}

/**
 * How many lines of the child's log are searched for the port move.
 *
 * The retry is announced before the dev server it starts publishes the lock this parent waits on,
 * so the sentence is always near the top of a log that a run truncates anyway. Generous rather
 * than exact, because a prebuild step ahead of it prints its own output first.
 */
const PORT_MOVE_LOG_LINES = 500;

/**
 * How many lines of the child's log are searched for its plan: all of them.
 *
 * The plan table is printed *first*, and the `run:*` step this matters for writes thousands of
 * lines of compiler output over it — so a tail, which is what `readDetachedLogSync` gives, would
 * miss it on exactly the run this exists for. The whole file is read either way; the number only
 * decides how much of it is handed back.
 */
const PHASE_LOG_LINES = Number.MAX_SAFE_INTEGER;

/** The port move the detached child announced in its log, or null when it announced none. */
function readPortMoveSync(projectRoot: string): PortMove | null {
  const read = readDetachedLogSync(projectRoot, PORT_MOVE_LOG_LINES);
  return read == null ? null : parsePortMove(read.lines.join('\n'));
}

function printHumanReport(report: DevDetachResultJson): void {
  const label = (name: string) => name.padEnd(13);
  // @ref llp/0004 §Implemented in v1 — F125. The URL stays on this line
  // because it is the one the dev server will answer on, and the words after it stop it being read
  // as a dev server that is up: a plan that is compiling has not started one.
  const where =
    report.phase === 'building'
      ? ' · not listening yet — the plan is still building'
      : report.alreadyRunning
        ? ' · already running'
        : ' · detached';
  const lines = [`${label('Dev server')}${report.url}${where}`, `${label('Process')}${report.pid}`];
  // Right under the URL, because that URL is the thing the move made stale: every command and
  // every link a caller had already written names the port that was asked for, not this one.
  if (report.portMoved) {
    lines.push(
      `${label('Port')}${
        report.portMoved.from == null
          ? `moved · the port it wanted was busy, so it took ${report.portMoved.to}`
          : `moved · ${report.portMoved.from} was busy, so it took ${report.portMoved.to}`
      }`
    );
  }
  if (report.logFile) {
    lines.push(`${label('Log')}${report.logFile}`);
  }
  if (report.ready != null) {
    lines.push(`${label('Bundler')}${report.ready ? 'ready' : 'not ready'}`);
  }
  // Under the listen address it is not: this is the one a device uses, and the difference between
  // the two is what a whole dogfood session was lost to [observed — 2026-08-24].
  if (report.tunnelUrl) {
    lines.push(`${label('Tunnel')}${report.tunnelUrl}`);
  }
  lines.push(`${label('Took')}${report.waitedMs}ms`);
  if (report.alreadyRunning) {
    lines.push(
      ` This project already had a dev server, so nothing was started. One detached dev server per project: a second one could not hold the lock, and nothing would be able to find or stop it.`
    );
  }
  Log.log(lines.join('\n'));
}

/** @ref llp/0009-smart-followups.rfc.md §Examples per command */
function detachFollowUps(report: DevDetachResultJson): FollowUp[] {
  const followups: FollowUp[] = [];
  if (report.ready == null) {
    followups.push({
      id: 'smoke',
      command: `${PROGRAM_PREFIX} smoke`,
      why: 'The dev server is up, but nothing has said whether its bundler finished, whether this project compiles, or whether the app comes up on it.',
    });
  }
  if (report.logFile) {
    followups.push({
      id: 'dev-logs',
      command: `${PROGRAM_PREFIX} dev:logs`,
      why: 'The dev server writes to a file now rather than to this terminal, and this is what reads it back.',
    });
  }
  followups.push({
    id: 'dev-stop',
    command: `${PROGRAM_PREFIX} dev:stop`,
    why: 'A detached dev server outlives this shell, so this is what ends it.',
  });
  return followups;
}

/** Poll the project's lock until it answers, the child dies, or the budget runs out. */
async function waitForLockAsync(
  projectRoot: string,
  { timeoutMs, hasExited }: { timeoutMs: number; hasExited: () => boolean }
): Promise<DevServerLockInfo | null> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const lock = await readDevServerLockAsync(projectRoot);
    if (lock) {
      return lock;
    }
    // Checked after the read, not before: a child that started the dev server and exited in the
    // same instant still published a lock, and that lock is the answer.
    if (hasExited()) {
      return null;
    }
    if (Date.now() + LOCK_POLL_INTERVAL_MS >= deadline) {
      return null;
    }
    await new Promise((resolve) => setTimeout(resolve, LOCK_POLL_INTERVAL_MS));
  }
}

/**
 * The log tail a failure quotes, or an empty string when there is none.
 *
 * Fenced rather than pasted in: the lines are Metro's, the Expo CLI's, and the app's own
 * `console.error` calls, none of which are this CLI speaking, and a failing bundle can carry
 * whatever text a file in the project holds (llp/0008-guardrails.rfc.md §Untrusted-content marking).
 */
function logTail(projectRoot: string): string {
  const read = readDetachedLogSync(projectRoot, FAILURE_LOG_LINES);
  return read?.lines.length
    ? `\n\nWhat the dev server printed:\n${wrapUntrustedAppOutput(read.lines.join('\n'))}`
    : '';
}

/** The error for a detached child that never published a lock. */
function notStartedError(
  projectRoot: string,
  logFile: string,
  childExit: { code: number | null; signal: NodeJS.Signals | null } | null,
  pid: number | null,
  waitedMs: number
): CommandError {
  const how = childExit
    ? `it exited ${childExit.signal ? `on ${childExit.signal}` : `with code ${childExit.code}`} before it did`
    : `it was still running ${waitedMs}ms later without having published one`;

  const error = new CommandError(
    'DEV_DETACH_FAILED',
    [
      `The detached dev server did not start${pid == null ? '' : ` (pid ${pid})`}.`,
      `Why: a dev server this CLI starts publishes its port on the project's lock as soon as it is listening, and ${how}. Without that lock nothing can find the dev server, so reporting one here would name a server no other command could reach.`,
      `How: read what it printed in ${logFile}, or run "${PROGRAM_PREFIX} dev --yes" in this terminal to watch the same start happen in the foreground.${logTail(projectRoot)}`,
    ].join('\n')
  );
  error.suggestedCommand = `${PROGRAM_PREFIX} dev:logs`;
  return error;
}

/**
 * The error for a detached dev server that came up but whose bundler never answered.
 *
 * Two failures wear this name, and the difference is whether anything answered at all. A wait that
 * ran out on a bundler that is still working is about time; a wait that got an answer from a dev
 * server serving *another project* is not about time at all, and telling that caller to wait longer
 * is a next action that cannot work.
 *
 * Exported for the test table: the whole value of this error is in its wording, and the only way to
 * check wording is to read it.
 */
export function notReadyError(
  lock: DevServerLockInfo,
  logFile: string,
  result: BundlerReadyResult,
  phase: DetachedChildPhase = { phase: 'serving', step: null, opensPlatform: false }
): CommandError {
  // @ref llp/0021-honest-reports.rfc.md §The rules — F125. A plan whose
  // dev-server step is `expo run:*` holds the lock while a compiler runs, so every sentence below
  // would otherwise be false at once: nothing started, nothing is on that port, and "the dev server
  // is still running" would describe Gradle. The wording follows the phase, and nothing else here
  // changes: the wait really did give up, and the exit code is the same.
  if (phase.phase === 'building') {
    return stillBuildingError(lock, logFile, result, phase);
  }

  const strangerAnswered = result.projectRootMatched === false;
  const error = new CommandError(
    'DEV_DETACH_NOT_READY',
    [
      `The dev server started on ${lock.url} (pid ${lock.pid}), but --wait-ready gave up before its bundler answered.`,
      `Why: ${result.reason ?? 'GET /status did not answer'}. ${
        strangerAnswered
          ? `That answer came from a dev server serving ${result.reportedProjectRoot}, which is not this project — so the wait was watching somebody else's bundler and this project's may well be ready.`
          : 'The dev server is still running — this is about the wait, not about the server.'
      }`,
      // @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization — friction run
      // 5, F48-10. Named on both paths, because the reader cannot tell the cases apart and this is
      // the one they will not think of: a port number is not a listener, and this CLI only ever
      // looks at one of the two a machine can have.
      `Note: this CLI reaches the dev server at ${lock.url}, over IPv4. A port number is not one listener — 127.0.0.1:${lock.port} and [::1]:${lock.port} are different sockets, so another process can be answering this port on the other stack while this project's dev server is fine, and neither will have reported a collision. "lsof -nP -iTCP:${lock.port} -sTCP:LISTEN" lists both.`,
      `How: run "${PROGRAM_PREFIX} smoke", which reports what the bundler is doing and whether this project compiles and runs, or read ${logFile} with "${PROGRAM_PREFIX} dev:logs". Stop it with "${PROGRAM_PREFIX} dev:stop".`,
    ].join('\n')
  );
  error.suggestedCommand = `${PROGRAM_PREFIX} smoke`;
  return error;
}

/**
 * The failure for a `--wait-ready` that ran out while the plan was still compiling.
 *
 * @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization
 * F125. Nothing has gone wrong: the child is building, the build is the expensive step it was asked
 * to run, and the only thing that failed is a wait whose budget is much shorter than a local build.
 * So this says what is happening and which step is doing it, and it does not offer `smoke`, which
 * cannot measure a bundler that has not started, or the split-stack note, which is about two
 * listeners on a port nothing is listening on yet.
 */
function stillBuildingError(
  lock: DevServerLockInfo,
  logFile: string,
  result: BundlerReadyResult,
  phase: DetachedChildPhase
): CommandError {
  const step = phase.step ?? 'the build step';
  const error = new CommandError(
    'DEV_DETACH_NOT_READY',
    [
      `No dev server is listening on ${lock.url} yet: the plan is still building, at "${step}" (pid ${lock.pid}), and --wait-ready gave up after ${result.waitedMs}ms.`,
      `Why: "${step}" is one command that builds the app, installs it, and only then starts the dev server. The port above is published when that step *starts*, so it names where the dev server will be rather than where one is — and a local build takes many minutes, which is longer than this wait. The build has not failed and it has not stopped; it is still going, in the process this command started.`,
      `How: watch it with "${PROGRAM_PREFIX} dev:logs" (the file is ${logFile}) and run "${PROGRAM_PREFIX} status" when it is done — the dev server answers on ${lock.url} the moment the build finishes. Stop the build with "${PROGRAM_PREFIX} dev:stop". To avoid the wait entirely, build once with "${PROGRAM_PREFIX} dev --android --yes" in a terminal: a recorded build makes the next detached run a dev server rather than a compiler.`,
    ].join('\n')
  );
  error.exitCode = EXIT_OUTCOME_FAILED;
  error.suggestedCommand = `${PROGRAM_PREFIX} dev:logs`;
  return error;
}

/**
 * This CLI's own entry script, for the child to run.
 *
 * `process.argv[1]` is the `bin/cli.js` that the caller invoked, whatever it is installed as,
 * which is the one thing guaranteed to start the same CLI the parent is.
 */
function resolveBinPath(): string {
  const bin = process.argv[1];
  if (!bin) {
    throw new CommandError(
      'DEV_DETACH_FAILED',
      `Could not work out which script to start in the background, because this process was started without one (process.argv[1] is empty). Run "${PROGRAM_PREFIX} dev" instead, which needs no second process.`
    );
  }
  return bin;
}
