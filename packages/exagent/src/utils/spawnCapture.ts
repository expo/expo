import { spawn } from 'child_process';

import { killProcessTree, USE_PROCESS_GROUP } from './processGroup';
import { acquireRunnerLockAsync, runnerSpawnKey, tryAcquireRunnerLock } from './runnerLock';
import { resolveSpawnTarget } from './windowsShim';

/** Outcome of one captured subprocess run. */
export interface SpawnCaptureResult {
  stdout: string;
  stderr: string;
  /** Exit code, or `null` when the process was signalled or never started. */
  exitCode: number | null;
  /** Set when the process could not be started, e.g. the binary is not on `PATH`. */
  spawnError?: NodeJS.ErrnoException;
}

/**
 * Run a command and capture its output.
 *
 * Never rejects: a non-zero exit code and a missing binary are both results the caller reports
 * to the user, so the failure message can name the tool instead of the exception.
 *
 * **A package runner waits its turn** (`./runnerLock.ts`, F93), the same way `spawnSubprocessAsync`
 * makes it: the cloud simulator's verbs come through here, and they are `npx eas-cli` too.
 */
export function spawnCaptureAsync(
  command: string,
  args: string[],
  options: { cwd?: string; timeoutMs?: number } = {}
): Promise<SpawnCaptureResult> {
  const key = runnerSpawnKey(command, args);
  if (key == null) {
    return spawnCaptureNowAsync(command, args, options);
  }
  // Nothing is holding it: spawn in this tick (`./runnerLock.ts` §tryAcquireRunnerLock).
  const free = tryAcquireRunnerLock(key);
  if (free) {
    return spawnCaptureNowAsync(command, args, options).finally(() => free.release());
  }
  return queuedCaptureAsync(key, command, args, options);
}

/** The contended case: wait for the runner ahead, then spawn with what is left of the budget. */
async function queuedCaptureAsync(
  key: string,
  command: string,
  args: string[],
  options: { cwd?: string; timeoutMs?: number }
): Promise<SpawnCaptureResult> {
  const lock = await acquireRunnerLockAsync(key, { timeoutMs: options.timeoutMs });
  if (lock == null) {
    // The same shape a killed deadline resolves to here: no code, nothing captured. The caller's
    // reason names the timeout it asked for, which is what the wait spent.
    return { stdout: '', stderr: '', exitCode: null };
  }
  try {
    return await spawnCaptureNowAsync(command, args, {
      ...options,
      timeoutMs:
        options.timeoutMs == null ? undefined : Math.max(1, options.timeoutMs - lock.queuedMs),
    });
  } finally {
    lock.release();
  }
}

/** Spawn now, with no regard for what else is running. The body of the function above. */
function spawnCaptureNowAsync(
  command: string,
  args: string[],
  options: { cwd?: string; timeoutMs?: number } = {}
): Promise<SpawnCaptureResult> {
  return new Promise<SpawnCaptureResult>((resolve, reject) => {
    // A `fingerprint` resolved inside a project is a batch shim on Windows, which needs `cmd.exe`.
    const target = resolveSpawnTarget(command, args);
    const child = spawn(target.command, target.args, {
      cwd: options.cwd,
      // The output is data for the caller, not something the user should read directly.
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: target.shell,
      // Its own process group, so the deadline below stops the tree rather than a runner whose
      // child then holds these pipes open forever (`src/utils/processGroup.ts`).
      detached: USE_PROCESS_GROUP,
    });

    // A lookup tool that hangs must not hang the command that asked. Only set when a caller
    // names a deadline: every other caller runs a tool that ends on its own.
    let deadline: NodeJS.Timeout | null = null;
    if (options.timeoutMs != null) {
      deadline = setTimeout(() => child && killProcessTree(child, 'SIGKILL'), options.timeoutMs);
      // An unreferenced timer never keeps the process alive on its own.
      deadline.unref?.();
    }

    const clearDeadline = () => {
      if (deadline != null) {
        clearTimeout(deadline);
        deadline = null;
      }
    };

    let stdout = '';
    let stderr = '';

    // Attaching the handlers can throw before any of them exists — `spawn` is replaceable, and a
    // replacement may hand back something that is not a child process. The deadline is armed by
    // then, and a timer left behind by a call that never settled fires into a process that has
    // moved on: a run that passed, ending in a stack trace about `kill` on `undefined`.
    try {
      child.stdout?.on('data', (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr?.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('error', (error: NodeJS.ErrnoException) => {
        clearDeadline();
        resolve({ stdout, stderr, exitCode: null, spawnError: error });
      });

      child.on('close', (code) => {
        clearDeadline();
        resolve({ stdout, stderr, exitCode: code });
      });
    } catch (error) {
      clearDeadline();
      reject(error);
    }
  });
}
