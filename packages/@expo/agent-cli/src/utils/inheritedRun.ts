// The other half of `subprocess.ts`. Everything there is *captured* — nothing on stdin, output read
// by this process — because that is what a wrapper driving a tool needs. This is the case where a
// person has the terminal and the child should own it: `expo start`, and `expo login`, which asks
// for a password.
//
// Extracted from `runExpoAsync`, which was the only caller until the auth commands started
// reaching for the EAS CLI too. The signal forwarding below is the reason it is shared rather than
// copied: getting it subtly different for one of the two CLIs is a bug nobody would look for.

import { spawn } from 'child_process';

import { withRunnerLockAsync, runnerSpawnKey } from './runnerLock';
import { resolveSpawnTarget } from './windowsShim';

/** Signals the terminal delivers to the whole process group, so the child gets them too. */
const TERMINAL_SIGNALS: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

/**
 * Run a command with this process's stdio, and resolve with the exit code it reported.
 *
 * The child inherits stdio, so what the tool prints is unchanged and what it asks can be answered.
 *
 * While the child runs, terminal signals are forwarded to it instead of ending this process. The
 * default action would kill the wrapper first, cutting off the child's shutdown output and losing
 * its exit code. Forwarding also makes `kill <@expo/agent-cli pid>` stop the child, which matters for
 * agents that drive the CLI programmatically. An interrupt then resolves as a clean exit, because
 * the stop was asked for.
 *
 * The two events are the caller's to emit, not this function's: each CLI has its own pair in the
 * event registry, and a shared runner that emitted a third name would silently retire them.
 *
 * **A package runner waits its turn** (`./runnerLock.ts`, F93). Unbounded here, unlike the captured
 * paths: a run that owns the terminal has no deadline to spend, and a person watching a queued
 * `npx expo start` is watching the runner ahead of it finish rather than a hang with no cause.
 *
 * @throws the raw spawn error, for a caller that knows what a missing binary means in its case.
 */
export function runInheritedAsync(
  command: string,
  args: string[],
  options: {
    cwd: string;
    onExit?: (code: number, signal: NodeJS.Signals | null) => void;
    onSpawnError?: (error: NodeJS.ErrnoException) => void;
  }
): Promise<number> {
  const key = runnerSpawnKey(command, args);
  return key == null
    ? runInheritedNowAsync(command, args, options)
    : withRunnerLockAsync(key, () => runInheritedNowAsync(command, args, options));
}

/** Spawn now, with no regard for what else is running. The body of the function above. */
function runInheritedNowAsync(
  command: string,
  args: string[],
  {
    cwd,
    onExit,
    onSpawnError,
  }: {
    cwd: string;
    onExit?: (code: number, signal: NodeJS.Signals | null) => void;
    onSpawnError?: (error: NodeJS.ErrnoException) => void;
  }
): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    // On Windows the resolved bin is a batch shim, which only `cmd.exe` can run.
    const target = resolveSpawnTarget(command, args);
    const child = spawn(target.command, target.args, {
      cwd,
      stdio: 'inherit',
      shell: target.shell,
    });

    const listeners = TERMINAL_SIGNALS.map((signal) => {
      const forward = () => {
        child.kill(signal);
      };
      process.on(signal, forward);
      return { signal, forward } as const;
    });
    const stopForwardingSignals = () => {
      for (const { signal, forward } of listeners) {
        process.off(signal, forward);
      }
    };

    child.on('error', (error: NodeJS.ErrnoException) => {
      stopForwardingSignals();
      onSpawnError?.(error);
      reject(error);
    });

    child.on('close', (code, signal) => {
      stopForwardingSignals();
      const exitCode = code ?? (signal === 'SIGINT' || signal === 'SIGTERM' ? 0 : 1);
      onExit?.(exitCode, signal);
      resolve(exitCode);
    });
  });
}
