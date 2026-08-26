// @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization
// @ref llp/0010-agent-conventions.rfc.md §Exit codes
// `exagent dev --detach`: start the dev server and give the terminal back.
//
// The friction this answers is the plainest one in the CLI. `exagent dev` runs the dev server in
// the foreground and says nothing about it, so the first thing a driving agent does is burn a
// command timeout waiting for a command that never returns, and every step after it — `dev:wait`,
// `navigate`, `runtime:errors` — needs a shell the dev server is not holding [F46, friction run 4].
//
// What is new here is only the *spawn*: the child is `exagent dev` again, unchanged, with its
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
import { followUpsEnabled, reportFollowUps, type FollowUp } from '../followups';
import * as Log from '../log';
import { waitForBundlerReadyAsync, type BundlerReadyResult } from '../runtime/waitReady';
import { requestsTunnel } from '../start/followUps';
import { CommandError } from '../utils/errors';
import { readDevServerLogSync } from './advertisedUrl';
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
 * Machine shape of `exagent dev --detach --json`.
 *
 * @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — one JSON object on stdout,
 * every key always present, and a fact the run does not have is null.
 */
export interface DevDetachResultJson {
  /** Origin the dev server listens on. */
  url: string;
  port: number;
  /** PID of the detached `exagent` process, which is what `dev:stop` signals. */
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
 * @param binPath the `exagent` entry script, i.e. this process' own `process.argv[1]`.
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
   * False for a caller that is *part of* another command's answer: `exagent smoke --start` starts a
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
      tunnelUrl: currentTunnelUrlSync(projectRoot),
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
      throw notReadyError(lock, logFile, result);
    }
  }

  return reportDetached(projectRoot, options, {
    lock,
    alreadyRunning: false,
    ready,
    projectRootMatched,
    startedAt,
    print,
    tunnelUrl: await waitForTunnelUrlAsync(projectRoot, options),
  });
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
 * Wait for the tunnel URL, but only for a run that asked for one.
 *
 * A run with no `--tunnel` has nothing to wait for and pays nothing: the whole cost of this is
 * paid by the runs it is for.
 */
async function waitForTunnelUrlAsync(
  projectRoot: string,
  options: DevOptions
): Promise<string | null> {
  if (!requestsTunnel(options.expoArgs)) {
    return null;
  }
  const deadline = Date.now() + TUNNEL_URL_WAIT_MS;
  for (;;) {
    const url = currentTunnelUrlSync(projectRoot);
    if (url != null || Date.now() >= deadline) {
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
  }: {
    lock: DevServerLockInfo;
    alreadyRunning: boolean;
    ready: boolean | null;
    projectRootMatched: boolean | null;
    startedAt: number;
    print: boolean;
    tunnelUrl: string | null;
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
    // Read from the child's own log, which is the only channel it has to this process. A run that
    // started nothing has no log of its own to read a move out of.
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

/** The port move the detached child announced in its log, or null when it announced none. */
function readPortMoveSync(projectRoot: string): PortMove | null {
  const read = readDetachedLogSync(projectRoot, PORT_MOVE_LOG_LINES);
  return read == null ? null : parsePortMove(read.lines.join('\n'));
}

function printHumanReport(report: DevDetachResultJson): void {
  const label = (name: string) => name.padEnd(13);
  const lines = [
    `${label('Dev server')}${report.url}${report.alreadyRunning ? ' · already running' : ' · detached'}`,
    `${label('Process')}${report.pid}`,
  ];
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
      id: 'dev-wait',
      command: 'npx exagent dev:wait',
      why: 'The dev server is up, but nothing has said whether its bundler finished or whether this project compiles.',
    });
  }
  if (report.logFile) {
    followups.push({
      id: 'dev-logs',
      command: 'npx exagent dev:logs',
      why: 'The dev server writes to a file now rather than to this terminal, and this is what reads it back.',
    });
  }
  followups.push({
    id: 'dev-stop',
    command: 'npx exagent dev:stop',
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

/** The log tail a failure quotes, or an empty string when there is none. */
function logTail(projectRoot: string): string {
  const read = readDetachedLogSync(projectRoot, FAILURE_LOG_LINES);
  return read?.lines.length ? `\n\nWhat the dev server printed:\n${read.lines.join('\n')}` : '';
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
      `How: read what it printed in ${logFile}, or run "npx exagent dev --yes" in this terminal to watch the same start happen in the foreground.${logTail(projectRoot)}`,
    ].join('\n')
  );
  error.suggestedCommand = 'npx exagent dev:logs';
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
  result: BundlerReadyResult
): CommandError {
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
      // @ref llp/0005-runtime-loop-tools.rfc.md §A port number is not one listener — friction run
      // 5, F48-10. Named on both paths, because the reader cannot tell the cases apart and this is
      // the one they will not think of: a port number is not a listener, and this CLI only ever
      // looks at one of the two a machine can have.
      `Note: this CLI reaches the dev server at ${lock.url}, over IPv4. A port number is not one listener — 127.0.0.1:${lock.port} and [::1]:${lock.port} are different sockets, so another process can be answering this port on the other stack while this project's dev server is fine, and neither will have reported a collision. "lsof -nP -iTCP:${lock.port} -sTCP:LISTEN" lists both.`,
      `How: wait for it with "npx exagent dev:wait", which reports what the bundler is doing and whether this project compiles, or read ${logFile} with "npx exagent dev:logs". Stop it with "npx exagent dev:stop".`,
    ].join('\n')
  );
  error.suggestedCommand = 'npx exagent dev:wait';
  return error;
}

/**
 * This CLI's own entry script, for the child to run.
 *
 * `process.argv[1]` is the `bin/exagent.js` that the caller invoked, whatever it is installed as,
 * which is the one thing guaranteed to start the same CLI the parent is.
 */
function resolveBinPath(): string {
  const bin = process.argv[1];
  if (!bin) {
    throw new CommandError(
      'DEV_DETACH_FAILED',
      `Could not work out which script to start in the background, because this process was started without one (process.argv[1] is empty). Run "npx exagent dev" instead, which needs no second process.`
    );
  }
  return bin;
}
