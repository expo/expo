import { CompileError } from '@ramonclaudio/compile';
import type { ProcessResult, RunProcessOptions } from '@ramonclaudio/compile';
import { spawn } from 'child_process';
import { addAbortListener } from 'events';

export async function runXcodeProcessAsync(
  command: string,
  args: readonly string[],
  options: Pick<RunProcessOptions, 'cwd' | 'env' | 'signal'>
): Promise<ProcessResult> {
  if (options.signal?.aborted) {
    throw new CompileError('Process was cancelled before starting.', { signal: 'SIGTERM' });
  }

  // Expo's root signal handler exits immediately. The child must receive terminal signals
  // directly instead of depending on a later listener to forward them to a detached group.
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const stdoutChunks: Buffer[] = [];
  const stderrChunks: Buffer[] = [];
  child.stdout.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
  child.stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk));

  let cancelled = false;
  const abortSubscription = options.signal
    ? addAbortListener(options.signal, () => {
        cancelled = true;
        child.kill('SIGTERM');
      })
    : undefined;

  try {
    return await new Promise<ProcessResult>((resolve, reject) => {
      child.once('error', (error) => {
        reject(new CompileError(`Could not start ${command}: ${error.message}`, { cause: error }));
      });
      child.once('close', (exitCode, signal) => {
        const output = {
          stdout: Buffer.concat(stdoutChunks).toString('utf8'),
          stderr: Buffer.concat(stderrChunks).toString('utf8'),
        };
        const completionSignal = cancelled ? 'SIGTERM' : signal;
        if (completionSignal) {
          resolve({ status: 'signaled', signal: completionSignal, ...output });
        } else if (exitCode !== null) {
          resolve({ status: 'exited', exitCode, ...output });
        } else {
          reject(new CompileError('Process closed without an exit code or signal.'));
        }
      });
    });
  } finally {
    abortSubscription?.[Symbol.dispose]();
  }
}
