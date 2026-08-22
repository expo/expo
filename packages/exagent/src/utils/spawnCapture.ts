import { spawn } from 'child_process';

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
 */
export function spawnCaptureAsync(
  command: string,
  args: string[],
  options: { cwd?: string } = {}
): Promise<SpawnCaptureResult> {
  return new Promise<SpawnCaptureResult>((resolve) => {
    // A `fingerprint` resolved inside a project is a batch shim on Windows, which needs `cmd.exe`.
    const target = resolveSpawnTarget(command, args);
    const child = spawn(target.command, target.args, {
      cwd: options.cwd,
      // The output is data for the caller, not something the user should read directly.
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: target.shell,
    });

    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error: NodeJS.ErrnoException) => {
      resolve({ stdout, stderr, exitCode: null, spawnError: error });
    });

    child.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code });
    });
  });
}
