import execa from 'execa';
import { boolish } from 'getenv';
import assert from 'node:assert';
import type { ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { clearTimeout, setTimeout } from 'node:timers';
import { stripVTControlCharacters } from 'node:util';
import treeKill from 'tree-kill';

/** If the verbose logging should be enabled by default, based on `EXPO_E2E_VERBOSE` or GitHub Actions running in debug mode */
const EXPO_E2E_VERBOSE = boolish('RUNNER_DEBUG', boolish('EXPO_E2E_VERBOSE', false));

type ExecuteOptions = Omit<execa.Options, 'cwd'> & {
  /** The command prefix to execute, otherwise the full `commandOrFlags` is executed */
  command?: string[];
  /** Log the full output of the child process, when omitted verbose is enabled through `EXPO_E2E_VERBOSE` or GitHub Actions debug mode  */
  verbose?: boolean;
};

/**
 * Execute a child process and wait until the process exits or errors.
 * This wraps the process execution in verbose logging, shown on errors or on any invocation with verbose enabled.
 */
export async function executeAsync(
  cwd: string,
  commandOrFlags: string[] = [],
  { command, verbose = EXPO_E2E_VERBOSE, ...spawnOptions }: ExecuteOptions = {}
) {
  const [bin, ...flags] = command ? command.concat(commandOrFlags) : commandOrFlags;
  const child = execa(bin, flags, { ...spawnOptions, cwd });

  if (verbose) {
    console.log('[execute]', bin, ...flags, { ...spawnOptions, cwd });
    processPipeOutput(child, 'execute');
  }

  return await child;
}

/**
 * Stop or kill a running the child process, and possible sub-processes it started.
 * This uses `tree-kill` to stop all processes on Linux, macOS, and Windows.
 * When using `force = true`, the child process ID assertion check is skipped.
 */
export async function killProcessAsync(
  child?: ChildProcess,
  signal: NodeJS.Signals = 'SIGKILL',
  force = false
) {
  if (!child || child.exitCode !== null) return;

  const killed = once(child, 'close');
  await new Promise<void>((resolve, reject) => {
    if (force && !child.pid) return resolve();
    assert(child.pid, 'Child process has no process ID, unable to kill process');
    treeKill(child.pid, signal, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

  await killed;
}

/**
 * Wait for a specific output value from a child process, using either `stderr` or `stdout`.
 * When the resolver returns a truthy value, this promise is resolved.
 */
export async function waitForProcessOutput<T>(
  child: ChildProcess,
  resolver: (output: any) => T | null | undefined
) {
  assert(child.stderr, 'Process has no available stderr stream, unable to wait for output');
  assert(child.stdout, 'Process has no available stdout stream, unable to wait for output');

  // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers
  let resolve: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  const onProcessOutput = (chunk: any) => {
    const result = resolver(chunk);
    if (result) resolve(result);
  };

  try {
    child.stderr.on('data', onProcessOutput);
    child.stdout.on('data', onProcessOutput);
    return await promise;
  } finally {
    child.stderr.off('data', onProcessOutput);
    child.stdout.off('data', onProcessOutput);
  }
}

/**
 * Wait for the child process to become "ready", defined through the resolver's promise.
 * This listens for possible spawn errors or unexepcted exits of the child process.
 */
export async function waitForProcessReady<T>(
  child: ChildProcess,
  resolver: () => Promise<T>,
  timeoutMs = 60_000
) {
  // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers
  let resolve: (value: T | PromiseLike<T>) => void;
  let reject: (reason: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const onProcessError = (spawnError: any) => {
    reject(processErrorToError(spawnError));
  };

  const onProcessExit = (code: number | null, signal: NodeJS.Signals | null) => {
    reject(processExitToError(code ?? signal));
  };

  // Add a check to ensure the process is ready within a set timeout.
  // Without this timeout, malformed ready checks are extremely hard to find.
  // NOTE(cedric): creating the error outside the timeout sets the proper stacktraces from where the ready check was called
  const readyError = new Error(
    `Process did not become ready within ${timeoutMs}ms. Ensure the ready check is resolving as expected.`
  );
  const readyTimeout = setTimeout(() => reject(readyError), timeoutMs);

  try {
    resolver().then(resolve!).catch(reject!);
    child.once('error', onProcessError);
    child.once('exit', onProcessExit);
    return await promise;
  } finally {
    clearTimeout(readyTimeout);
    child.off('error', onProcessError);
    child.off('exit', onProcessExit);
  }
}

/**
 * Convert the spawn error into an actual error that renders all available information.
 * Errors thrown through `child.on('error')` are not actual Error instances, and may obfuscate the information.
 */
export function processErrorToError(spawnError: any) {
  if (spawnError instanceof Error) return spawnError;

  const cause = new Error(
    'syscall' in spawnError && 'spawnargs' in spawnError
      ? `${spawnError.code} ${spawnError.syscall} ${spawnError.spawnargs}`
      : `${spawnError.code} ${spawnError.message}`
  );

  Object.defineProperty(cause, 'code', {
    value: spawnError.code,
  });

  return new Error('Process failed to spawn', { cause });
}

/**
 * Convert the unexpected `child.on('exit')` information into a descriptive error instance.
 * This should render the received exit code or signal, with a human-readable message.
 */
export function processExitToError(
  codeOrSignal: number | NodeJS.Signals | null,
  message = 'Process exited unexpectedly with:'
) {
  return new Error(`${message} ${codeOrSignal || 'unknown exit reason'}`);
}

/**
 * Pipe the received output of the child process into the current process output stream.
 * This will append a prefix for each line, to make it more readable.
 * Once the process exits or errors, the listeners are removed automatically.
 */
export function processPipeOutput(child: ChildProcess, prefix = 'child process') {
  const prefixLines = (prefix: string, output: string) =>
    `[${prefix}] ${output.split('\n').join(`\n[${prefix}] `)}`;

  const onProcessStderr = (chunk: any) =>
    process.stderr.write(prefixLines(`${prefix} stderr`, chunk));
  const onProcessStdout = (chunk: any) =>
    process.stdout.write(prefixLines(`${prefix} stdout`, chunk));

  child.stderr?.on('data', onProcessStderr);
  child.stdout?.on('data', onProcessStdout);

  child.once('close', () => {
    child.stderr?.off('data', onProcessStderr);
    child.stdout?.off('data', onProcessStdout);
  });
}

/**
 * Find a prefixed value from the process output chunk, and return it.
 * When the prefixed value isn't found, this returns `null`.
 */
export function processFindPrefixedValue(chunk: any, prefix: string) {
  const lines = stripVTControlCharacters(chunk.toString()).split('\n');
  const line = lines.find((line) => line.includes(prefix));

  if (line) {
    return line.split(prefix).pop()?.trim() ?? null;
  }

  return null;
}
