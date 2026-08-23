/* eslint-env jest */
import { spawn, type ChildProcess } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { createServer, type Server } from 'node:http';
import net from 'node:net';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { stripVTControlCharacters } from 'node:util';

/** The `exagent` bin, spawned as a subprocess in every e2e test. Requires `pnpm build` first. */
export const bin = path.resolve(__dirname, '../bin/exagent.js');

/** Directory holding the committed fixture projects. */
export const fixturesDir = path.resolve(__dirname, 'fixtures');

/**
 * The temporary directory to use when testing projects.
 * This resolves the `EXPO_E2E_TEMP_DIR` environment variable, or uses `os.tmpdir()`.
 */
export const TEMP_DIR = process.env.EXPO_E2E_TEMP_DIR
  ? path.resolve(process.env.EXPO_E2E_TEMP_DIR)
  : os.tmpdir();

/** Generate a random temporary directory path. */
export function getTemporaryPath(): string {
  return path.join(TEMP_DIR, `exagent-e2e-${Math.random().toString(36).substring(2)}`);
}

/** Log the full output of child processes, enabled through `EXPO_E2E_VERBOSE`. */
const verboseDefault = !!process.env.EXPO_E2E_VERBOSE;

/** Name of the file the stub `expo` bin appends one JSON line to per invocation. */
export const STUB_EXPO_LOG_NAME = 'stub-expo-invocations.jsonl';

/**
 * Copy a committed fixture project to a fresh temporary directory, and install the stub `expo`
 * bin into it. Every test gets its own copy, so tests never share mutable project state.
 *
 * @param fixtureName Directory name inside `e2e/fixtures`
 * @returns The absolute path of the copied project
 */
export async function setupFixtureAsync(fixtureName: string): Promise<string> {
  const projectRoot = path.join(getTemporaryPath(), fixtureName);
  await fs.promises.mkdir(projectRoot, { recursive: true });
  // `verbatimSymlinks` keeps the copy from dereferencing fixture symlinks into real directories.
  await fs.promises.cp(path.join(fixturesDir, fixtureName), projectRoot, {
    recursive: true,
    verbatimSymlinks: true,
  });
  await installStubExpoAsync(projectRoot);
  return projectRoot;
}

/**
 * Install one stub bin the way npm and pnpm install a real one: a `sh` shim for posix and a `.cmd`
 * shim for Windows, both starting the stub script with the Node that runs the test.
 *
 * Both shims always exist, whatever the platform, because that is the layout the resolvers under
 * test look for — `resolveExpoCli` and friends pick the `.cmd` name on Windows and the bare name
 * everywhere else. A stub that ships only one of them is not testing the resolver, it is testing
 * the fallback.
 *
 * Executable bits are set here instead of committed to git, so the fixtures stay plain files.
 *
 * The name and the script are the caller's: `expo` for the fixtures, `eas` and `create-launch` for
 * the deploy tests, and anything else a command reaches for — including a script that never exits,
 * for a command that has to be tested against a tool that stalls.
 *
 * @param binDir Directory the shims go into, e.g. `node_modules/.bin` or `.stub-bin`
 * @param name Bin name without an extension, e.g. `expo`
 * @param stubScript Absolute path of the Node script the shims run
 */
export async function installStubBinAsync(
  binDir: string,
  name: string,
  stubScript: string
): Promise<void> {
  await fs.promises.mkdir(binDir, { recursive: true });

  const shPath = path.join(binDir, name);
  await fs.promises.writeFile(
    shPath,
    `#!/bin/sh\nexec "${process.execPath}" "${stubScript}" "$@"\n`
  );
  await fs.promises.chmod(shPath, 0o755);

  // Windows cannot execute either the shebang script or an extensionless file, so the `.cmd` shim
  // is the only thing a spawn there can reach.
  await fs.promises.writeFile(
    path.join(binDir, `${name}.cmd`),
    `@echo off\r\n"${process.execPath}" "${stubScript}" %*\r\n`
  );
}

/**
 * Write the executable shims that make `expo` resolve to the fixture's stub bin, both through
 * `PATH` (see {@link stubExpoEnv}) and through the project's `node_modules/.bin`.
 */
async function installStubExpoAsync(projectRoot: string): Promise<void> {
  const stubScript = path.join(projectRoot, 'node_modules', 'expo', 'bin', 'cli');
  const dirs = [
    path.join(projectRoot, '.stub-bin'),
    path.join(projectRoot, 'node_modules', '.bin'),
  ];

  for (const dir of dirs) {
    await installStubBinAsync(dir, 'expo', stubScript);
  }
}

/**
 * Write the `node_modules/.bin/fingerprint` shims for a fixture that ships the stub
 * `@expo/fingerprint` package, so the project-state probe finds a fingerprint CLI to spawn.
 *
 * A no-op for fixtures without that package: the probe reports a null hash for those, which is
 * the case most fixtures are there to cover.
 *
 * @returns whether the shims were written
 */
export async function installStubFingerprintAsync(projectRoot: string): Promise<boolean> {
  const stubScript = path.join(projectRoot, 'node_modules', '@expo', 'fingerprint', 'bin', 'cli');
  if (!fs.existsSync(stubScript)) {
    return false;
  }

  await installStubBinAsync(
    path.join(projectRoot, 'node_modules', '.bin'),
    'fingerprint',
    stubScript
  );
  return true;
}

/**
 * Environment that makes any bare `expo` spawn resolve to the fixture's stub bin.
 *
 * Windows spells the variable `Path`, and a child that inherits both spellings resolves a bin
 * through whichever one the platform happens to pick, so both carry the stub directory there. One
 * spelling with the stub and one without is a test that passes or fails by luck.
 */
export function stubExpoEnv(projectRoot: string): Record<string, string> {
  const inherited = process.env.PATH ?? process.env.Path ?? '';
  const withStub = `${path.join(projectRoot, '.stub-bin')}${path.delimiter}${inherited}`;
  return process.platform === 'win32' ? { PATH: withStub, Path: withStub } : { PATH: withStub };
}

/** One recorded invocation of the stub `expo` bin. */
export type StubExpoInvocation = {
  /** Arguments the wrapper forwarded, without the bin itself */
  args: string[];
  /** Working directory the subprocess ran in */
  cwd: string;
};

/** Read every invocation of the stub `expo` bin recorded for a project. */
export function readStubExpoInvocations(projectRoot: string): StubExpoInvocation[] {
  const logPath = path.join(projectRoot, STUB_EXPO_LOG_NAME);
  if (!fs.existsSync(logPath)) {
    return [];
  }
  return fs
    .readFileSync(logPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export type ExecuteResult = {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  /** Interleaved `stdout` and `stderr` */
  all: string;
};

export type ExecuteOptions = {
  /** Extra environment variables for the child process */
  env?: Record<string, string | undefined>;
  /** Throw when the process exits with a non-zero code, defaults to `true` */
  reject?: boolean;
  /** Log the full child process output */
  verbose?: boolean;
};

/**
 * Execute `node bin/exagent.js <args>` inside a project, and wait for the process to exit.
 * Output is stripped of ANSI escape codes, so assertions never depend on color support.
 */
export async function executeExagentAsync(
  cwd: string,
  args: string[] = [],
  { env, reject = true, verbose = verboseDefault }: ExecuteOptions = {}
): Promise<ExecuteResult> {
  const child = spawnExagent(cwd, args, { env });
  const output = collectOutput(
    child,
    verbose ? (chunk) => console.log(`[exagent] ${chunk}`) : undefined
  );
  const result = await waitForExitAsync(child, output);

  if (reject && result.exitCode !== 0) {
    throw new Error(
      `\`exagent ${args.join(' ')}\` exited with ${result.exitCode ?? result.signal}:\n${result.all}`
    );
  }
  return result;
}

/**
 * Spawn `node bin/exagent.js <args>` without waiting for it to exit, for long-running commands
 * like `exagent start`. Callers are responsible for killing the process.
 */
export function spawnExagent(
  cwd: string,
  args: string[] = [],
  { env }: Pick<ExecuteOptions, 'env'> = {}
): ChildProcess {
  // Strip `npm_config_minimum_release_age` inherited from the monorepo's pnpm-workspace.yaml,
  // as it blocks recently published packages without the matching exclusion list.
  const { npm_config_minimum_release_age, ...processEnv } = process.env;

  return spawn(process.execPath, [bin, ...args], {
    cwd,
    // Own process group, so `killAsync` can stop the `expo` subprocess the wrapper spawned too.
    detached: process.platform !== 'win32',
    env: {
      ...processEnv,
      // Deterministic, non-interactive output.
      CI: '1',
      FORCE_COLOR: '0',
      NO_COLOR: '1',
      ...stubExpoEnv(cwd),
      ...env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

/** Collect the output of a child process, with ANSI escape codes removed. */
export function collectOutput(
  child: ChildProcess,
  onOutput?: (output: string) => void
): { stdout: string; stderr: string; all: string } {
  const collected = { stdout: '', stderr: '', all: '' };

  const collect = (type: 'stdout' | 'stderr', chunk: any) => {
    const output = stripVTControlCharacters(chunk.toString());
    collected[type] += output;
    collected.all += output;
    onOutput?.(output);
  };

  child.stdout?.on('data', (chunk) => collect('stdout', chunk));
  child.stderr?.on('data', (chunk) => collect('stderr', chunk));

  return collected;
}

/** Wait for a child process to exit, and return its exit information with the collected output. */
export async function waitForExitAsync(
  child: ChildProcess,
  output: { stdout: string; stderr: string; all: string }
): Promise<ExecuteResult> {
  const { exitCode, signal } = await new Promise<{
    exitCode: number | null;
    signal: NodeJS.Signals | null;
  }>((resolve, reject) => {
    child.once('error', reject);
    // `close` instead of `exit`, so the output streams are fully flushed.
    child.once('close', (code, signal) => resolve({ exitCode: code, signal }));
  });

  return { exitCode, signal, ...output };
}

/**
 * Kill a child process and every subprocess it started, then wait for it to close.
 * The whole group must go, or the `expo` subprocess keeps the output pipes open.
 */
export async function killAsync(
  child: ChildProcess,
  signal: NodeJS.Signals = 'SIGTERM'
): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }
  const closed = new Promise<void>((resolve) => child.once('close', () => resolve()));
  try {
    if (process.platform !== 'win32' && child.pid) {
      // A negative PID signals the process group created by `detached: true`.
      process.kill(-child.pid, signal);
    } else {
      child.kill(signal);
    }
  } catch {
    // The process tree already exited.
  }
  await closed;
}

/** Poll a condition until it becomes true, or the timeout expires. Returns the last result. */
export async function waitForAsync(
  check: () => boolean,
  timeoutMs: number,
  intervalMs = 100
): Promise<boolean> {
  const endTime = Date.now() + timeoutMs;
  while (!check() && Date.now() < endTime) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return check();
}

/** Relative path of the file that caches the selected agents between runs. */
export const AGENT_SELECTION_FILE = path.join('.expo', 'agent-skill-links.json');

/**
 * Pre-seed the agent selection a previous `exagent skills` run would have cached. The automatic
 * sync of `install` and `start` only runs when this selection exists.
 */
export async function writeAgentSelectionAsync(
  projectRoot: string,
  agentIds: string[]
): Promise<void> {
  const filePath = path.join(projectRoot, AGENT_SELECTION_FILE);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, JSON.stringify({ agents: agentIds }, null, 2));
}

/** Read a project file, or return `null` when it does not exist. */
export function readProjectFile(projectRoot: string, ...segments: string[]): string | null {
  const filePath = path.join(projectRoot, ...segments);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
}

/** What the dev-server lock of a project answers with, per `src/devLock/types.ts`. */
export type DevLockInfo = {
  url: string;
  port: number;
  pid: number;
  startedAt: string;
  projectRoot: string;
};

/**
 * Address of a project's dev-server lock.
 *
 * Deliberately a second implementation of `src/devLock/address.ts`: the lock is a wire contract
 * between two processes that share no code, and a test deriving the address from the code under
 * test could not notice the address changing. If the two disagree, these tests fail.
 */
export function devLockAddress(projectRoot: string): string {
  // Symlinks resolved, so the test and the CLI spell one project one way.
  const canonical = fs.realpathSync(path.resolve(projectRoot));
  const digest = crypto
    .createHash('sha1')
    .update(canonical.toLowerCase())
    .digest('hex')
    .slice(0, 16);

  if (process.platform === 'win32') {
    return `\\\\.\\pipe\\exagent-dev-server-${digest}`;
  }
  const inProject = path.join(canonical, '.expo', 'exagent-dev-server.sock');
  // Over the kernel's ~104-byte cap on a socket path, the lock moves to the temporary directory.
  return inProject.length <= 100
    ? inProject
    : path.join(os.tmpdir(), `exagent-dev-server-${digest}.sock`);
}

/**
 * Ask a project's dev-server lock where its dev server listens, or get null when nothing answers.
 *
 * The read is a connection: nothing answers unless a process is holding the address open right
 * now, which is the property these tests are here to check.
 */
export function readDevLockAsync(
  projectRoot: string,
  timeoutMs = 1000
): Promise<DevLockInfo | null> {
  return new Promise((resolve) => {
    let answer = '';
    let settled = false;
    const socket = net.connect(devLockAddress(projectRoot));
    const finish = (info: DevLockInfo | null) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(info);
    };
    const parse = (): DevLockInfo | null => {
      try {
        return JSON.parse(answer.split('\n')[0]!);
      } catch {
        return null;
      }
    };
    socket.setEncoding('utf8');
    socket.setTimeout(timeoutMs, () => finish(parse()));
    socket.on('data', (chunk: string) => {
      answer += chunk;
      if (answer.includes('\n')) finish(parse());
    });
    socket.on('error', () => finish(null));
    socket.on('close', () => finish(parse()));
  });
}

/** Poll a project's dev-server lock until it answers, or the timeout expires. */
export async function waitForDevLockAsync(
  projectRoot: string,
  timeoutMs = 30_000,
  intervalMs = 250
): Promise<DevLockInfo | null> {
  const endTime = Date.now() + timeoutMs;
  for (;;) {
    const info = await readDevLockAsync(projectRoot, intervalMs * 2);
    if (info != null || Date.now() >= endTime) {
      return info;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

/** How a stub dev server should answer, per {@link startStubDevServerAsync}. */
export type StubDevServerOptions = {
  /**
   * Debugger targets `GET /json/list` answers with — the apps a command under test will believe
   * are connected. Defaults to none, which is a dev server nothing has attached to yet.
   */
  targets?: unknown[];
  /**
   * Delay before `GET /status` answers, in milliseconds.
   *
   * A real dev server does not answer while it is still coming up, and a command that waits for
   * one has to be tested against that, not only against a server that is instantly ready.
   */
  statusDelayMs?: number;
  /** Project root the `/status` answer names in its header, as the real dev server does. */
  projectRoot?: string;
};

/** A stub dev server, and where it listens. */
export type StubDevServer = {
  /** Origin to hand to `--dev-server-url`, e.g. `http://127.0.0.1:53421`. */
  url: string;
  port: number;
  /** Stop listening and wait for the server to close. */
  close(): Promise<void>;
};

/**
 * Start an HTTP server that answers the two requests `exagent` uses to recognize a dev server:
 * `GET /status`, which a real Metro answers with `packager-status:running` and the project root in
 * a header, and `GET /json/list`, the debugger target list.
 *
 * It is a double for the protocol, not for Metro: nothing is bundled and no app is involved, so a
 * test can pin what a command does with a dev server that is up, one that is slow to answer, or
 * one with no app attached, in milliseconds and with no ports to guess. Listens on `127.0.0.1` and
 * an ephemeral port, so parallel test files never collide.
 */
export async function startStubDevServerAsync({
  targets = [],
  statusDelayMs = 0,
  projectRoot = '/stub-project',
}: StubDevServerOptions = {}): Promise<StubDevServer> {
  const server: Server = createServer((request, response) => {
    const route = (request.url ?? '').split('?')[0];

    if (route === '/status') {
      // The delay is the point of the option: the socket is accepted and left open, exactly as a
      // dev server that is still starting leaves a probe waiting.
      setTimeout(() => {
        response.writeHead(200, {
          'Content-Type': 'text/plain',
          'X-React-Native-Project-Root': projectRoot,
        });
        response.end('packager-status:running');
      }, statusDelayMs);
      return;
    }

    if (route === '/json/list') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(targets));
      return;
    }

    response.writeHead(404).end();
  });

  // Nothing keeps the test process alive because of the stub: a test that forgets to close one
  // fails on its assertions, not on a jest run that never ends.
  server.unref();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    port,
    close: () =>
      new Promise<void>((resolve) => {
        // Any request left waiting on `statusDelayMs` holds the server open otherwise.
        server.closeAllConnections?.();
        server.close(() => resolve());
      }),
  };
}

/**
 * Hold a dev-server lock for a project the way `exagent start` does, so a command under test can
 * read one without a dev server existing.
 *
 * @returns a callback that releases the lock
 */
export async function holdDevLockAsync(
  projectRoot: string,
  info: DevLockInfo
): Promise<() => void> {
  const address = devLockAddress(projectRoot);
  await fs.promises.mkdir(path.dirname(address), { recursive: true });
  await fs.promises.rm(address, { force: true }).catch(() => {});

  const server = net.createServer((socket) => {
    socket.on('error', () => {});
    socket.end(`${JSON.stringify(info)}\n`);
  });
  server.unref();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(address, () => resolve());
  });

  return () => {
    server.close();
    if (process.platform !== 'win32') {
      fs.rmSync(address, { force: true });
    }
  };
}
