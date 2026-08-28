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
import { WebSocketServer, type WebSocket } from 'ws';

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

/** Name of the file the stub `fingerprint` bin appends one JSON line to per invocation. */
export const STUB_FINGERPRINT_LOG_NAME = 'stub-fingerprint-invocations.jsonl';

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
 * Install a stub **package runner** that answers for the `eas-cli` package.
 *
 * @ref llp/0015-backend-selection-and-config.rfc.md §Resolving the EAS CLI
 * Every EAS-backed command spawns `npx --yes eas-cli…` or `bunx eas-cli…`, so a suite that used to
 * plant a bin called `eas` has to plant a runner instead. Nothing under test resolves a file called
 * `eas` any more, which is the property the single rung exists for — and it means an e2e that forgot
 * this would reach the **real** npx and download the real CLI, so these stubs are also what keeps
 * the suite off the network.
 *
 * The runner it stands in for verifies its own argv rather than ignoring it: `--yes` is stripped
 * because that flag is npm's own, and a spec that is not `eas-cli` is an error, exactly as npx would
 * treat a package it cannot find. What is left is handed to the stub `eas` script, so every existing
 * assertion about the EAS argv keeps its meaning.
 *
 * @param binDir Directory the shims go into, which must be on the `PATH` of the command under test
 * @param easScript Absolute path of the stub `eas` Node script to run for the package
 * @param names Which runners to install. Both, when a test is about which one is chosen.
 */
export async function installStubEasRunnerAsync(
  binDir: string,
  easScript: string,
  { names = ['npx'], logFile }: { names?: ('npx' | 'bunx')[]; logFile?: string } = {}
): Promise<void> {
  const runnerScript = path.join(binDir, 'stub-eas-runner.js');
  await fs.promises.mkdir(binDir, { recursive: true });
  await fs.promises.writeFile(
    runnerScript,
    `#!/usr/bin/env node
'use strict';
const args = process.argv.slice(2);
${
  logFile
    ? `require('node:fs').appendFileSync(${JSON.stringify(logFile)}, JSON.stringify({ args, runner: process.env.STUB_RUNNER_NAME || null }) + '\\n');`
    : ''
}
// \`--yes\` is npm's own flag, and never part of what the package is asked to do.
const rest = args[0] === '--yes' ? args.slice(1) : args;
const spec = rest[0] || '';
if (spec !== 'eas-cli' && spec !== 'eas-cli@latest') {
  process.stderr.write('stub runner: no such package ' + JSON.stringify(spec) + '\\n');
  process.exit(1);
}
const result = require('node:child_process').spawnSync(
  process.execPath,
  [${JSON.stringify(easScript)}, ...rest.slice(1)],
  { stdio: 'inherit' }
);
process.exit(result.status === null ? 1 : result.status);
`
  );
  for (const name of names) {
    await installStubBinAsync(binDir, name, runnerScript);
  }
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
  /**
   * `CI` as the subprocess saw it, or null when nothing set it.
   *
   * Layer 2 of the needs-human protocol is exactly this variable, and the dev-server step is
   * exactly its exception (llp/0010 §Force non-interactive), so it is worth recording rather than
   * inferring from behaviour.
   */
  ci: string | null;
  /** Whether the subprocess had a TTY on stdout, which is the other half of that decision. */
  isTTY: boolean;
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

/** One recorded invocation of the stub `fingerprint` bin. */
export type StubFingerprintInvocation = {
  /** Arguments the wrapper sent, without the bin itself — so a `--platform` is visible here. */
  args: string[];
  cwd: string;
};

/**
 * Read every invocation of the stub `fingerprint` bin recorded for a project.
 *
 * @ref llp/0023-fingerprint-caching.rfc.md §Proof
 * The only way to observe the caching from outside: a memo hit, a cache hit and a recomputation all
 * print the same hash, and differ only in how many subprocesses were spawned.
 */
export function readStubFingerprintInvocations(projectRoot: string): StubFingerprintInvocation[] {
  const logPath = path.join(projectRoot, STUB_FINGERPRINT_LOG_NAME);
  if (!fs.existsSync(logPath)) {
    return [];
  }
  return fs
    .readFileSync(logPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

/** Forget every invocation recorded so far, so the next command's count starts at zero. */
export function clearStubFingerprintInvocations(projectRoot: string): void {
  fs.rmSync(path.join(projectRoot, STUB_FINGERPRINT_LOG_NAME), { force: true });
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

/**
 * The top-level `--json` keys a rendered help block names, read back out of the block itself.
 *
 * @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — **F144.** The `keys` line is a
 * promise about the object the command prints, and a promise nothing compares against the object is
 * one that drifts silently: `status --json` and `runtime:errors --json` both emitted a `followups`
 * array that neither help block named [observed — friction run 9]. Parsing the *rendered* block
 * rather than reading the help spec is the point — it is what a caller reads.
 *
 * The layout is `src/help/format.ts`'s: a `keys` label, then any wrapped rows under it in the same
 * column.
 */
export function documentedJsonKeys(helpOutput: string): string[] {
  const lines = stripVTControlCharacters(helpOutput).split('\n');
  const start = lines.findIndex((line) => /^\s+keys\s{2,}\S/.test(line));
  if (start < 0) {
    return [];
  }
  const rows = [lines[start]!.replace(/^\s+keys\s+/, '')];
  for (const line of lines.slice(start + 1)) {
    // A wrapped row carries no label, so it is indented past the label column. Anything else — the
    // blank line, the next section head — ends the list.
    if (!/^\s{10,}\S/.test(line)) {
      break;
    }
    rows.push(line.trim());
  }
  return rows
    .join(' ')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);
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
  /**
   * Project root the `/status` answer names in its header, as the real dev server does.
   *
   * `null` sends no header at all, which is the "undecidable" case: a dev server that names no
   * project root has not been shown to be the wrong one, and the commands that compare roots have
   * to tell that apart from a root that does not match.
   */
  projectRoot?: string | null;
  /**
   * How the stub answers a request for the entry bundle, which is what `dev:wait` checks the
   * project's own code with.
   *
   * - `compiles` — the manifest names an entry bundle, and building it succeeds.
   * - `broken` — building it answers 500 with the `TransformError` body Metro sends.
   * - `no-manifest` — `GET /` 404s, which is the "cannot decide" case a dev server too old to
   *   answer produces.
   */
  bundle?: 'compiles' | 'broken' | 'no-manifest';
  /**
   * Origin the manifest's `launchAsset.url` carries, instead of this stub's own `127.0.0.1` one.
   *
   * What the real dev server puts there is `getDevServerUrl()`, which is the **tunnel** origin
   * whenever a tunnel or a proxy is in front of it — and that is the one address a cloud simulator
   * can use (llp/0005 §Where a device reaches the dev server). A stub bound to the loopback cannot
   * be reached by a hostname, so this is how a test says "this dev server is advertising itself to
   * the world" without inventing DNS.
   */
  manifestOrigin?: string;
  /** Delay before the entry bundle answers, standing in for a cold first build. */
  bundleDelayMs?: number;
  /**
   * How the stub answers on `/message`, the client command socket `exagent runtime:reload` broadcasts on.
   *
   * - `v2` — the real protocol: every frame carries `version: 2`, `getpeers` is answered, and a
   *   `reload` broadcast replaces the reported peer ids, which is what a reloading app does.
   * - `deaf` — the socket opens and nothing is ever answered. This is a dev server speaking
   *   another protocol version, which drops a frame it cannot read without an error.
   * - `no-churn` — `getpeers` is answered but a broadcast changes nothing, i.e. the app did not
   *   act on the reload.
   * - `none` — no socket is mounted at all, so the upgrade is refused.
   */
  messageSocket?: 'v2' | 'deaf' | 'no-churn' | 'none';
  /**
   * Whether the debugger sockets the listed targets point at accept a connection.
   *
   * `live` (the default) is a connected app. `none` is a **stale** target: the dev server still
   * lists the page and nothing is behind it, which is what an app that was force-stopped leaves
   * behind, and what `exagent status` used to count as a connected app [friction run 6, F56].
   *
   * `no-debugger` is the third real state, and the one the exit-code contract turns on: the socket
   * is open and every CDP method is answered `-32601 Method not found`. That is not a double for a
   * JavaScript runtime — llp/0002 §Tier 0 doubles the dev server, not the app rules one out — it is
   * a double for a runtime having **no** debugger, which is a fact about the protocol and nothing
   * about React Native. Expo Go for Android is exactly this [observed — Expo Go 57.0.9 on an
   * Android emulator, 2026-08-22, recorded in `createDefaultTargetSelector`], and it is the state
   * that makes `--fail-on-error` exit 22 rather than report health nothing observed.
   */
  inspectorSocket?: 'live' | 'none' | 'no-debugger';
  /**
   * How the inspector socket answers `Runtime.evaluate`, for the commands that ask the app a
   * question rather than only connecting to it.
   *
   * The expression arrives as the CLI sent it, wrapper and all (`src/runtime/promiseSettling.ts`),
   * so a responder recognises the call it cares about by a marker in the source. Returning
   * `undefined` answers `{type: "undefined"}`, which is what an expression whose value is nothing
   * comes back as — and is what the target selector's own probe expects.
   */
  inspectorEvaluate?: (expression: string) => unknown;
  /**
   * Clients `getpeers` reports before any reload. Defaults to one that looks like an iOS app.
   *
   * An empty object is a dev server nothing has connected to, which is the case where there is
   * nothing to reload.
   */
  messagePeers?: Record<string, string | null>;
  /**
   * What `GET /json/list` reports after a reload has been asked for.
   *
   * Either mechanism asks: a `reload` broadcast on a `v2` socket, or the
   * `expo.reloadAppAsync()` evaluate `runtime:reload`'s debugger method sends.
   *
   * The peer churn and the debugger target list are two independent facts, and friction run 4
   * found `runtime:reload` believing the first about the second. The three values are the three
   * things a real app does:
   *
   * - `reconnect` (default) — the app's JavaScript registers again under a page id the dev server
   *   has never used, which is what a reload looks like [observed — 2026-08-23, live: `8a9d…-1`
   *   -> `8a9d…-2`, 761 ms after the broadcast].
   * - `stale` — the peers churn and the same target stays listed, i.e. the runtime that answers is
   *   the one from before the reload (F39).
   * - `gone` — the app quits and the list empties (F45).
   * - `late-reconnect` — the list empties *and then* the new page id appears, after
   *   {@link reloadReconnectDelayMs}. This is what `reconnect` above compresses to nothing and what
   *   a real app actually does: the runtime that was listed goes and the one that replaces it takes
   *   about half a second to register [observed — 2026-08-23, live: 506ms then 761ms]. Anything that
   *   reads the list inside that window sees an app that is not there, which is F39 for the command
   *   after the reload and F141 for the reload's own report of `appsConnected`.
   */
  reloadTargets?: 'reconnect' | 'stale' | 'gone' | 'late-reconnect';
  /** How long `late-reconnect` leaves the list empty for. */
  reloadReconnectDelayMs?: number;
  /**
   * File a `Bundled` line is appended to when a reload is asked for, or null for none.
   *
   * The dev server's own output, which a detached run captures — and the third proof of a reload
   * (`src/runtime/reload/bundleSignal.ts`, S11). A test points this at the project's
   * `.expo/dev/logs/dev-detached.log` to make the bundle the signal that answers **first**, which is
   * the only way to reproduce a reload proved while the debugger target list is still empty.
   */
  bundleLogPath?: string | null;
  /**
   * Path of a file whose existence is what makes {@link targets} appear in `GET /json/list`.
   *
   * For the device method, where the app is *started* rather than reloaded: its JavaScript runtime
   * registers because a device tool launched it, so the stub reports nothing until the stub device
   * tool has run. Without this the fixture would have to claim an app that has a debugger target
   * and no message-socket peer, which no real app is, and the reload would then be measured
   * against a target that was there all along.
   */
  targetsAppearWithFile?: string | null;
};

/** The `TransformError` body Metro answers a broken build with, recorded from an SDK 57 app. */
export const STUB_TRANSFORM_ERROR = {
  type: 'TransformError',
  lineNumber: 101,
  column: 2,
  filename: 'src/app/index.tsx',
  name: 'SyntaxError',
  message:
    "SyntaxError: /project/src/app/index.tsx: Unexpected keyword 'const'. (101:2)\n\n[0m [90m 100 |[39m function broken( {\n[31m[1m>[22m[39m[90m 101 |[39m   [36mconst[39m x [33m=[39m[0m",
  errors: [{ description: 'Unexpected keyword', filename: 'src/app/index.tsx', lineNumber: 101 }],
};

/** Path of the entry bundle the stub manifest names, matching an Expo Router project. */
const STUB_BUNDLE_PATH = '/node_modules/expo-router/entry.bundle';

/**
 * The error page the web dev server renders for a project that does not compile, cut to the fields
 * that are read [observed — `@expo/cli` `metroErrorInterface.ts`, and live on 2026-08-23].
 *
 * `<` is escaped exactly as the CLI escapes it, so the payload cannot close its own script tag.
 */
export const STUB_WEB_ERROR_PAGE = `<html><body><div id="root"></div><script id="_expo-static-error" type="application/json">${JSON.stringify(
  {
    selectedLogIndex: 0,
    logs: [
      {
        level: 'static',
        message: {
          content: `${STUB_TRANSFORM_ERROR.message.replace(/\u001b\[[\d;]*m/g, '')}`,
        },
        stack: [{ file: '/project/src/app/index.tsx', lineNumber: 101, column: 2 }],
        codeFrame: {
          content: '  101 |   const x =',
          location: { row: 101, column: 2 },
          fileName: '/project/src/app/index.tsx',
        },
      },
    ],
  }
).replace(/</g, '\\u003c')}</script></body></html>`;

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
  bundle = 'compiles',
  manifestOrigin,
  bundleDelayMs = 0,
  messageSocket = 'v2',
  inspectorSocket = 'live',
  messagePeers = { 'socket#1': 'role=ios' },
  reloadTargets = 'reconnect',
  reloadReconnectDelayMs = 700,
  bundleLogPath = null,
  targetsAppearWithFile = null,
  inspectorEvaluate,
}: StubDevServerOptions = {}): Promise<StubDevServer> {
  let port = 0;
  // Mutable, because a reload changes it: the debugger target list is the evidence a reload is
  // judged on, so a stub that always answers the same list can only test an app that never moved.
  let listedTargets: unknown[] = targets;
  let nextPageId = 100;
  const server: Server = createServer((request, response) => {
    const route = (request.url ?? '').split('?')[0];

    // The manifest, which is the only thing that knows the entry path of this project. A real dev
    // server answers it with an Expo Updates manifest whose `launchAsset.url` is the bundle URL.
    if (route === '/' && request.headers['expo-platform']) {
      if (bundle === 'no-manifest') {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(
        JSON.stringify({
          id: 'stub-manifest',
          runtimeVersion: 'exposdk:57.0.0',
          launchAsset: {
            key: 'bundle',
            contentType: 'application/javascript',
            url: `${manifestOrigin ?? `http://127.0.0.1:${port}`}${STUB_BUNDLE_PATH}?platform=${request.headers['expo-platform']}&dev=true`,
          },
        })
      );
      return;
    }

    // The web dev server has no manifest: `GET /` is the page a browser loads, and the entry
    // bundle is the `<script src>` appended to it. A project that does not compile never produces
    // that page — the server renders it, so the failure arrives as the 500 error page instead.
    if (route === '/') {
      if (bundle === 'no-manifest') {
        response.writeHead(404).end();
        return;
      }
      if (bundle === 'broken') {
        response.writeHead(500, { 'Content-Type': 'text/html' });
        response.end(STUB_WEB_ERROR_PAGE);
        return;
      }
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.end(
        `<html><body><div id="root"></div><script src="${STUB_BUNDLE_PATH}?platform=web&dev=true" defer></script></body></html>`
      );
      return;
    }

    if (route === STUB_BUNDLE_PATH) {
      // Unreferenced, so a delay a test deliberately never waits out cannot hold the worker open.
      setTimeout(() => {
        if (bundle === 'broken') {
          response.writeHead(500, { 'Content-Type': 'application/json; charset=UTF-8' });
          // HEAD gets the status and no body, exactly as it does from Metro.
          response.end(request.method === 'HEAD' ? '' : JSON.stringify(STUB_TRANSFORM_ERROR));
          return;
        }
        response.writeHead(200, { 'Content-Type': 'application/javascript' });
        response.end(request.method === 'HEAD' ? '' : 'var __BUNDLE_START_TIME__=0;');
      }, bundleDelayMs).unref();
      return;
    }

    if (route === '/status') {
      // The delay is the point of the option: the socket is accepted and left open, exactly as a
      // dev server that is still starting leaves a probe waiting. Unreferenced, so a long delay
      // that a test deliberately never waits out cannot hold the jest worker open for its length.
      setTimeout(() => {
        response.writeHead(200, {
          'Content-Type': 'text/plain',
          ...(projectRoot == null ? {} : { 'X-React-Native-Project-Root': projectRoot }),
        });
        response.end('packager-status:running');
      }, statusDelayMs).unref();
      return;
    }

    if (route === '/json/list') {
      const started = targetsAppearWithFile == null || fs.existsSync(targetsAppearWithFile);
      response.writeHead(200, { 'Content-Type': 'application/json' });
      // Rewritten onto this stub's own port, the way a real dev server publishes its debugger URLs
      // — a fixture URL naming 8081 or no port at all is one nothing can connect to, and
      // `exagent status` now opens each of them to tell a live target from a page an app left
      // behind (llp/0005 §Android, F56).
      response.end(JSON.stringify(started ? listedTargets.map(onThisPort) : []));
      return;
    }

    response.writeHead(404).end();
  });

  // The client command socket, mounted the way the real dev server mounts it: an exact-path
  // upgrade on `/message`. This is a double for the *protocol*, so the `version: 2` stamp and the
  // `getpeers` request/response pair are reproduced verbatim — they are the two things a change
  // upstream would break, and they are invisible to a unit test.
  /** One listed target with its debugger URL moved onto the port this stub ended up on. */
  const onThisPort = (target: unknown): unknown => {
    const url = (target as { webSocketDebuggerUrl?: unknown }).webSocketDebuggerUrl;
    if (typeof url !== 'string' || !url) {
      return target;
    }
    const query = url.split('?')[1];
    return {
      ...(target as Record<string, unknown>),
      webSocketDebuggerUrl: `ws://127.0.0.1:${port}/inspector/debug${query ? `?${query}` : ''}`,
    };
  };

  /**
   * What the debugger target list reports once a reload has been *asked for*.
   *
   * The app's JavaScript runtime re-registers separately from its command-socket connection, and
   * later: the two are different connections, and believing the first about the second is friction
   * run 4's F39 and F45. Shared by the two mechanisms that ask — the `reload` broadcast and the
   * `expo.reloadAppAsync()` evaluate — because the app does the same thing either way.
   */
  const applyReloadTargets = (): void => {
    if (bundleLogPath != null) {
      fs.mkdirSync(path.dirname(bundleLogPath), { recursive: true });
      fs.appendFileSync(
        bundleLogPath,
        'iOS Bundled 25ms node_modules/expo-router/entry.js (1 module)\n'
      );
    }
    if (reloadTargets === 'gone') {
      listedTargets = [];
    } else if (reloadTargets === 'reconnect') {
      listedTargets = reloadedTargets(listedTargets);
    } else if (reloadTargets === 'late-reconnect') {
      const coming = reloadedTargets(listedTargets);
      listedTargets = [];
      // Unreferenced, so a delay a test never waits out cannot hold the jest worker open.
      setTimeout(() => {
        listedTargets = coming;
      }, reloadReconnectDelayMs).unref();
    }
  };

  /** The same targets under page ids the dev server has never used, which is what a reload does. */
  const reloadedTargets = (current: unknown[]): unknown[] => {
    const pageId = nextPageId++;
    return current.map((target) => ({
      ...(target as Record<string, unknown>),
      id: `${(target as { id?: string }).id ?? 'device'}-reloaded-${pageId}`,
    }));
  };

  let peers: Record<string, string | null> = { ...messagePeers };
  let nextPeerId = 100;
  const messageServer = messageSocket === 'none' ? null : new WebSocketServer({ noServer: true });
  const inspectorServer = inspectorSocket === 'none' ? null : new WebSocketServer({ noServer: true });
  // A runtime with no debugger: the socket is there, and every method it is asked for comes back
  // `-32601`. `live` stays silent instead, which is a runtime that is being asked nothing.
  if (inspectorSocket === 'no-debugger') {
    inspectorServer?.on('connection', (socket: WebSocket) => {
      socket.on('message', (data) => {
        let message: { id?: unknown };
        try {
          message = JSON.parse(String(data));
        } catch {
          return;
        }
        if (message.id == null) {
          return;
        }
        socket.send(
          JSON.stringify({ id: message.id, error: { code: -32601, message: 'Method not found' } })
        );
      });
    });
  }
  // A connected app that is asked nothing answers nothing, which is what `live` alone reproduces.
  // With a responder, the socket also speaks the one CDP method the reading commands send. A
  // `no-debugger` socket keeps its `-32601` answer instead: the responder is a runtime that talks,
  // and that socket's whole point is a runtime that cannot.
  if (inspectorEvaluate && inspectorSocket !== 'no-debugger') {
    inspectorServer?.on('connection', (socket: WebSocket) => {
      socket.on('message', (data) => {
        let message: { id?: number; method?: string; params?: { expression?: string } };
        try {
          message = JSON.parse(String(data));
        } catch {
          return;
        }
        if (message.method !== 'Runtime.evaluate') {
          return;
        }
        const expression = message.params?.expression ?? '';
        const value = inspectorEvaluate(expression);
        // The reload asked for over the debugger, which `runtime:reload --method runtime` sends.
        // Its probe half carries the diagnostic string below and the call does not, which is the
        // only thing that tells them apart: every expression this CLI sends is wrapped, and the
        // wrapper's own source is in both.
        if (expression.includes('reloadAppAsync') && !expression.includes('no-expo-global')) {
          applyReloadTargets();
        }
        socket.send(
          JSON.stringify({
            id: message.id,
            result: {
              result:
                value === undefined
                  ? { type: 'undefined' }
                  : { type: typeof value === 'object' ? 'object' : typeof value, value },
            },
          })
        );
      });
    });
  }
  messageServer?.on('connection', (socket: WebSocket) => {
    socket.on('message', (data) => {
      if (messageSocket === 'deaf') {
        return;
      }
      let message: { version?: unknown; method?: unknown; target?: unknown; id?: unknown };
      try {
        message = JSON.parse(String(data));
      } catch {
        return;
      }
      // A frame without the current protocol version is dropped with no answer, exactly as
      // `parseRawMessage` drops it.
      if (message.version !== 2) {
        return;
      }
      if (message.target === 'server' && message.method === 'getpeers') {
        socket.send(JSON.stringify({ id: message.id, result: peers, version: 2 }));
        return;
      }
      if (message.method === 'reload' && message.target === undefined && messageSocket === 'v2') {
        // An app that acts on the reload drops its connection and makes a new one, which the dev
        // server registers under an id it has never used before.
        peers = Object.fromEntries(
          Object.values(peers).map((query) => [`socket#${nextPeerId++}`, query])
        );
        applyReloadTargets();
      }
    });
  });
  server.on('upgrade', (request, socket, head) => {
    // The inspector socket a debugger target points at. `live` keeps it open and answers nothing,
    // which is exactly what a connected app that is not being asked anything does; `none` refuses
    // the upgrade, which is what a stale page left in `/json/list` does.
    if (inspectorServer && (request.url ?? '').split('?')[0] === '/inspector/debug') {
      inspectorServer.handleUpgrade(request, socket as never, head, (ws) => {
        inspectorServer.emit('connection', ws, request);
      });
      return;
    }
    if (messageServer && (request.url ?? '').split('?')[0] === '/message') {
      messageServer.handleUpgrade(request, socket as never, head, (ws) => {
        messageServer.emit('connection', ws, request);
      });
      return;
    }
    socket.destroy();
  });

  // Nothing keeps the test process alive because of the stub: a test that forgets to close one
  // fails on its assertions, not on a jest run that never ends.
  server.unref();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  // Read back rather than chosen, and captured for the manifest: the bundle URL a dev server
  // publishes is absolute, so the stub has to know the ephemeral port it ended up on.
  port = (server.address() as AddressInfo).port;
  return {
    url: `http://127.0.0.1:${port}`,
    port,
    close: () =>
      new Promise<void>((resolve) => {
        // Any request left waiting on `statusDelayMs` holds the server open otherwise.
        for (const client of [
          ...(messageServer?.clients ?? []),
          ...(inspectorServer?.clients ?? []),
        ]) {
          client.terminate();
        }
        messageServer?.close();
        inspectorServer?.close();
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
