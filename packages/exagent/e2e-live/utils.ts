/* eslint-env jest */
// @ref llp/0022-live-tier.plan.md §What a live assertion is allowed to be
//
// The harness for the live tier. It differs from `e2e/utils.ts` in three ways, and each is a
// consequence of there being no stub on the other side of the spawn:
//
//  1. **No stub bins, and no `CI=1`.** `e2e/utils.ts` installs a stub `expo` and a stub `eas` into
//     every fixture and points the CLI at them. Nothing here does: the point of this tier is the
//     binary the project resolves and the service it answers from.
//  2. **Evidence is kept.** A stub failure is reproducible from the test file; a live failure is a
//     fact about a moment. Every invocation appends its argv, exit code and full output to a
//     per-run artifacts directory, so a red run leaves something to read.
//  3. **A cost line.** A run of this tier spends wall time, and sometimes a deployment or a cloud
//     session. `costLine` prints what it spent, so nobody has to guess before running it.

import { spawn, type ChildProcess, execFile } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { stripVTControlCharacters } from 'node:util';
import zlib from 'node:zlib';

import { assertStaging, bin } from './prereq';

export { bin } from './prereq';

/** Directory holding the fixture sources copied into a scratch project. */
export const fixturesDir = path.resolve(__dirname, 'fixtures');

/**
 * Root of the scratch area, which must be **outside any git repository**.
 *
 * @ref llp/0002-testing-and-evals.plan.md §A flag is not shipped until it has run against the
 * published binary
 * Not a preference. `eas deploy` and `eas build` upload the project by walking up to the nearest
 * git root, so a scratch project created inside this monorepo uploads the monorepo — minutes of
 * transfer, and a deployment that is not the fixture. `os.tmpdir()` is outside every checkout on
 * every machine this runs on, and the suites assert it.
 */
export const liveTempRoot = path.join(
  process.env.EXAGENT_LIVE_TEMP_DIR ? path.resolve(process.env.EXAGENT_LIVE_TEMP_DIR) : os.tmpdir(),
  'exagent-live'
);

/** First dev-server port this tier tries. Above the Expo CLI's own 8081-8085 sweep, and above 8500
 * so a live run never collides with the ports a human or another suite is using. */
export const LIVE_PORT_BASE = Number(process.env.EXAGENT_LIVE_PORT ?? 8500);

/**
 * The first free port at or above `from`, checked by binding it.
 *
 * A live tier has to do this rather than hardcode a port, and the reason is a cascade this suite
 * caused for itself [observed — 2026-08-27]: a run that crashed left a dev server on 8500, the next
 * run's `dev --detach --wait-ready` failed in 1.7 s because the port was taken, and **22 of 31 tests**
 * went red reporting the consequences of one stale process. The tier is meant to find bugs in the CLI,
 * and a whole suite red for a reason that is not about the CLI is the loudest possible way to hide one.
 */
export async function findFreePortAsync(from = LIVE_PORT_BASE, tries = 50): Promise<number> {
  for (let port = from; port < from + tries; port++) {
    const free = await new Promise<boolean>((resolve) => {
      const server = net.createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => server.close(() => resolve(true)));
      server.listen(port, '127.0.0.1');
    });
    if (free) {
      return port;
    }
  }
  throw new Error(`no free port between ${from} and ${from + tries} for this run's dev server`);
}

/** Timestamp component that sorts, for run directories and deployment names. */
function stamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

/**
 * One run's scratch project, artifacts directory and running cost, threaded through a suite.
 *
 * A class rather than module state so two suites in one jest process cannot see each other's
 * temp directory — and so `afterAll` has one object to clean up and one object to report.
 */
export class LiveRun {
  readonly suite: string;
  readonly startedAt = Date.now();
  readonly artifactsDir: string;
  readonly tempDir: string;

  /** What this run spent that is not wall time, printed by {@link costLine}. */
  readonly spend = { commands: 0, deploys: 0, cloudSessions: 0, scaffolds: 0 };

  private readonly cleanups: {
    what: string;
    run: () => Promise<void> | void;
  }[] = [];

  constructor(suite: string) {
    this.suite = suite;
    const id = `${suite}-${stamp()}`;
    this.tempDir = path.join(liveTempRoot, id);
    this.artifactsDir = path.join(__dirname, '.artifacts', id);
    fs.mkdirSync(this.tempDir, { recursive: true });
    fs.mkdirSync(this.artifactsDir, { recursive: true });
    this.assertOutsideGitRepository();
  }

  /**
   * That the scratch directory is not inside a checkout, checked rather than assumed.
   *
   * The trap this closes is silent: an upload from inside a repository succeeds, so nothing fails —
   * it just uploads the wrong tree. `.git` may be a directory or a worktree's file, so both count.
   */
  private assertOutsideGitRepository(): void {
    let dir = this.tempDir;
    for (;;) {
      if (fs.existsSync(path.join(dir, '.git'))) {
        throw new Error(
          `Refusing to run: the live scratch directory ${this.tempDir} is inside the git repository at ${dir}. ` +
            `EAS uploads walk up to the git root, so a deploy from here would upload that repository. ` +
            `Point EXAGENT_LIVE_TEMP_DIR at a directory outside every checkout.`
        );
      }
      const parent = path.dirname(dir);
      if (parent === dir) {
        return;
      }
      dir = parent;
    }
  }

  /** Register something to undo in `afterAll`, newest first. */
  onCleanup(what: string, run: () => Promise<void> | void): void {
    this.cleanups.unshift({ what, run });
  }

  /**
   * Run every registered cleanup, and keep going when one throws.
   *
   * Order matters and failure does not: a dev server left running holds a port and a lock that the
   * next run reads as this project's own, and the reason this run went red is very often also the
   * reason one of these will. Each failure is printed and the rest still run.
   */
  async cleanUpAsync(): Promise<void> {
    for (const { what, run } of this.cleanups) {
      try {
        await run();
      } catch (error: any) {
        console.log(`[live] cleanup "${what}" failed (continuing): ${error?.message ?? error}`);
      }
    }
    this.cleanups.length = 0;
  }

  /**
   * What this run spent, printed in `afterAll` whether it passed or failed.
   *
   * The audience is somebody deciding whether to run this tier, and the numbers that matter to them
   * are the ones with a price: wall time, deployments made, cloud-session minutes started.
   */
  costLine(): string {
    const seconds = Math.round((Date.now() - this.startedAt) / 1000);
    const spent = [
      `${seconds}s wall`,
      `${this.spend.commands} exagent runs`,
      `${this.spend.scaffolds} scaffolds`,
      `${this.spend.deploys} deploys`,
      `${this.spend.cloudSessions} cloud sessions`,
    ].join(' · ');
    return `[live] cost ${this.suite}: ${spent} — evidence ${path.relative(process.cwd(), this.artifactsDir)}`;
  }

  /** Write one evidence file into this run's artifacts directory, and return its path. */
  writeArtifact(name: string, contents: string | Buffer): string {
    const file = path.join(this.artifactsDir, name.replace(/[^\w.@-]+/g, '_'));
    fs.writeFileSync(file, contents);
    return file;
  }
}

export type LiveResult = {
  argv: string[];
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  /** Interleaved `stdout` and `stderr`, for a human reading the artifact. */
  all: string;
  durationMs: number;
  /** Where the full output of this invocation was written. */
  artifact: string;
};

export type LiveOptions = {
  /** Extra environment for the child. `EXPO_STAGING` is added by {@link runLiveEasAsync}. */
  env?: Record<string, string | undefined>;
  /** Label for the evidence file, so a failure is findable by what it was doing. */
  label?: string;
};

let sequence = 0;

/**
 * Run the built `exagent` bin against a real project, and keep the evidence.
 *
 * Never rejects on a non-zero exit: in this tier the exit code is usually the assertion, and a
 * helper that threw on 20 would make every gate test write a try/catch. `reject` is the stub tier's
 * convenience and belongs there.
 */
export async function runLiveAsync(
  run: LiveRun,
  cwd: string,
  argv: string[],
  { env, label }: LiveOptions = {}
): Promise<LiveResult> {
  run.spend.commands += 1;
  const startedAt = Date.now();

  // Three things are stripped, and the second one is the whole reason this helper exists rather than
  // a bare `spawn`:
  //
  //  - `npm_config_minimum_release_age`, inherited from the monorepo's pnpm-workspace.yaml, blocks
  //    recently published packages — and what the registry serves is this tier's subject.
  //  - **`NODE_ENV` and `JEST_WORKER_ID`.** jest sets `NODE_ENV=test`, and a live child that inherits
  //    it is not running the code a user runs: `@react-native/dev-middleware` throws
  //    *"DefaultToolLauncher must be mocked or overridden in tests"* out of `expo start`, so the dev
  //    server never comes up [observed — 2026-08-27, the first run of this suite]. A live tier that
  //    leaks its runner's environment is testing a path nobody ships, which is the failure mode the
  //    tier exists to close, one level up.
  const { npm_config_minimum_release_age, NODE_ENV, JEST_WORKER_ID, ...processEnv } = process.env;

  const child = spawn(process.execPath, [bin, ...argv], {
    cwd,
    // Own process group, so `stopProcessTreeAsync` can end the `expo` subprocess the wrapper spawned.
    detached: process.platform !== 'win32',
    env: {
      ...processEnv,
      // Deterministic output. Deliberately *not* `CI=1`: CI changes how the Expo CLI prompts, and
      // "what a real non-interactive run does" is what this tier is measuring.
      FORCE_COLOR: '0',
      NO_COLOR: '1',
      ...env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const collected = { stdout: '', stderr: '', all: '' };
  const collect = (type: 'stdout' | 'stderr', chunk: any) => {
    const text = stripVTControlCharacters(chunk.toString());
    collected[type] += text;
    collected.all += text;
  };
  child.stdout?.on('data', (chunk) => collect('stdout', chunk));
  child.stderr?.on('data', (chunk) => collect('stderr', chunk));

  const { exitCode, signal } = await new Promise<{
    exitCode: number | null;
    signal: NodeJS.Signals | null;
  }>((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, sig) => resolve({ exitCode: code, signal: sig }));
  });

  const durationMs = Date.now() - startedAt;
  const name = `${String(++sequence).padStart(3, '0')}-${label ?? argv.join('_')}.txt`;
  const artifact = run.writeArtifact(
    name,
    [
      `$ exagent ${argv.join(' ')}`,
      `cwd: ${cwd}`,
      `exit: ${exitCode} signal: ${signal} in ${durationMs}ms`,
      '',
      collected.all,
    ].join('\n')
  );

  return { argv, exitCode, signal, durationMs, artifact, ...collected };
}

/**
 * The same, with `EXPO_STAGING=1` forced on and asserted.
 *
 * Every EAS-touching invocation in this tier goes through here rather than passing the variable at
 * the call site, because "one call site forgot" is exactly the failure the guard exists for.
 */
export async function runLiveEasAsync(
  run: LiveRun,
  cwd: string,
  argv: string[],
  options: LiveOptions = {}
): Promise<LiveResult> {
  assertStaging(`exagent ${argv.join(' ')}`);
  return runLiveAsync(run, cwd, argv, {
    ...options,
    env: { ...options.env, EXPO_STAGING: '1' },
  });
}

/**
 * Parse a `--json` result, and fail with the evidence when it is not JSON.
 *
 * The message names the artifact rather than quoting the output: a live failure is often kilobytes
 * of a bundler's opinion, and a jest assertion message that long is unreadable in a terminal.
 */
export function parseJson<T = any>(result: LiveResult): T {
  try {
    return JSON.parse(result.stdout) as T;
  } catch (error: any) {
    throw new Error(
      `"exagent ${result.argv.join(' ')}" did not print JSON on stdout (exit ${result.exitCode}): ` +
        `${error.message}. Full output: ${result.artifact}`
    );
  }
}

/**
 * Whether a result is an **uncaught exception** rather than a report this CLI chose to print.
 *
 * F94: `src/utils/errors.ts` registers `process.on('uncaughtException', handleTooManyOpenFileErrors)`,
 * and that handler rethrows everything that is not macOS `EMFILE`. Rethrowing from inside an
 * `uncaughtException` handler makes Node exit **7** — which is the code `llp/0010` reserves for
 * needs-human — with a raw stack, no `Try:` line and no `--json` envelope. Every crash therefore looks
 * to an agent exactly like "a person has to intervene".
 *
 * Detected here rather than left to a reader because the failure is otherwise a puzzle: "exited 7,
 * expected 0" on a command that has no needs-human path at all.
 */
export function looksLikeUncaughtException(result: LiveResult): boolean {
  return result.exitCode === 7 && /\nNode\.js v\d/.test(result.all);
}

/** Assert an exit code, with the artifact path in the message rather than the whole output. */
export function expectExit(result: LiveResult, code: number, why?: string): void {
  if (result.exitCode !== code) {
    const crashed = looksLikeUncaughtException(result)
      ? ' This is an uncaught exception, not a report: exit 7 plus a raw Node stack is F94, ' +
        'the rethrow in the `uncaughtException` handler. The first stack frame in the artifact is the ' +
        'real failure.'
      : '';
    throw new Error(
      `"exagent ${result.argv.join(' ')}" exited ${result.exitCode}, expected ${code}` +
        `${why ? ` (${why})` : ''}.${crashed} Full output: ${result.artifact}`
    );
  }
}

/** Spawn a command that is not `exagent` — a package manager, `curl`, `xcrun`. */
export async function execAsync(
  command: string,
  args: string[],
  {
    cwd,
    env,
    timeoutMs = 600_000,
  }: { cwd?: string; env?: Record<string, string>; timeoutMs?: number } = {}
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const { NODE_ENV, JEST_WORKER_ID, npm_config_minimum_release_age, ...processEnv } = process.env;
  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      {
        cwd,
        env: { ...processEnv, ...env },
        timeout: timeoutMs,
        maxBuffer: 64 * 1024 * 1024,
      },
      (error: any, stdout, stderr) => {
        if (error && typeof error.code !== 'number') {
          reject(error);
          return;
        }
        resolve({
          exitCode: error?.code ?? 0,
          stdout: String(stdout),
          stderr: String(stderr),
        });
      }
    );
  });
}

/** End a process and everything it started, then wait for it to close. */
export async function stopProcessTreeAsync(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }
  const closed = new Promise<void>((resolve) => child.once('close', () => resolve()));
  try {
    if (process.platform !== 'win32' && child.pid) {
      process.kill(-child.pid, 'SIGTERM');
    } else {
      child.kill('SIGTERM');
    }
  } catch {
    // Already gone.
  }
  await closed;
}

/**
 * Poll until a check passes, and return whether it did.
 *
 * @ref llp/0022-live-tier.plan.md §What a live assertion is allowed to be
 * The only timing primitive in this harness, and it takes a *bound* rather than an expectation: a
 * live assertion may say "this became true within a generous bound" and may never say "this took
 * 300ms". A bound that expires is a real failure; a bound that is met in a different number of
 * milliseconds on a busy machine is not a finding about the CLI.
 */
export async function waitForAsync(
  check: () => boolean | Promise<boolean>,
  boundMs: number,
  intervalMs = 500
): Promise<boolean> {
  const deadline = Date.now() + boundMs;
  for (;;) {
    if (await check()) {
      return true;
    }
    if (Date.now() >= deadline) {
      return false;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

/** Copy a directory tree, preferring APFS clones so a 800 MB project copy is not a minute. */
export async function copyTreeAsync(from: string, to: string): Promise<void> {
  if (process.platform === 'darwin') {
    const cloned = await execAsync('cp', ['-Rc', from, to]);
    if (cloned.exitCode === 0) {
      return;
    }
  }
  fs.cpSync(from, to, { recursive: true });
}

/** Which package manager a project's lockfile names. Live projects are not all npm. */
export function packageManagerFor(projectRoot: string): {
  command: string;
  args: string[];
} {
  if (
    fs.existsSync(path.join(projectRoot, 'bun.lock')) ||
    fs.existsSync(path.join(projectRoot, 'bun.lockb'))
  ) {
    return { command: 'bun', args: ['install'] };
  }
  if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))) {
    return { command: 'pnpm', args: ['install'] };
  }
  if (fs.existsSync(path.join(projectRoot, 'yarn.lock'))) {
    return { command: 'yarn', args: ['install'] };
  }
  return { command: 'npm', args: ['install'] };
}

/** Install a scratch project's dependencies with whatever its lockfile asks for. */
export async function installDependenciesAsync(run: LiveRun, projectRoot: string): Promise<void> {
  const { command, args } = packageManagerFor(projectRoot);
  const result = await execAsync(command, args, { cwd: projectRoot });
  run.writeArtifact(`install-${path.basename(projectRoot)}.txt`, result.stdout + result.stderr);
  if (result.exitCode !== 0) {
    throw new Error(
      `"${command} ${args.join(' ')}" failed in ${projectRoot} (exit ${result.exitCode}): ${result.stderr.slice(-2000)}`
    );
  }
}

/** HTTP status of a URL, or 0 when nothing answered. Used to prove a deployment serves. */
export async function httpStatusAsync(url: string): Promise<number> {
  const result = await execAsync(
    'curl',
    ['-sS', '-L', '-o', '/dev/null', '-m', '30', '-w', '%{http_code}', url],
    { timeoutMs: 60_000 }
  );
  return Number(result.stdout.trim()) || 0;
}

/** Body of a URL, for asserting a deployment served the fixture rather than an error page. */
export async function httpBodyAsync(url: string): Promise<string> {
  const result = await execAsync('curl', ['-sS', '-L', '-m', '30', url], {
    timeoutMs: 60_000,
  });
  return result.stdout;
}

/**
 * Download a file and brotli-decode it when it is brotli.
 *
 * @ref llp/0021 — an EAS build log is served brotli-encoded, and `inspect:build-log` refuses binary
 * input with exit 22 on purpose. Both halves are worth testing, so this returns both: the bytes as
 * served, and the decoded text.
 */
export async function downloadBuildLogAsync(
  run: LiveRun,
  url: string
): Promise<{ rawPath: string; decodedPath: string }> {
  const rawPath = path.join(run.tempDir, 'build-log.raw');
  const download = await execAsync('curl', ['-sS', '-o', rawPath, '-m', '120', url], {
    timeoutMs: 180_000,
  });
  if (download.exitCode !== 0 || !fs.existsSync(rawPath)) {
    throw new Error(
      `could not download the build log (curl exit ${download.exitCode}): ${download.stderr}`
    );
  }
  const raw = fs.readFileSync(rawPath);
  const decodedPath = path.join(run.tempDir, 'build-log.txt');
  fs.writeFileSync(decodedPath, zlib.brotliDecompressSync(raw));
  return { rawPath, decodedPath };
}
