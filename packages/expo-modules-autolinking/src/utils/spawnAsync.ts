import { spawn, SpawnOptions } from 'child_process';

/**
 * Lightweight version of @expo/spawn-async. Returns a promise that is fulfilled with the output of
 * stdout, or rejected with the error event object (or the output of stderr).
 */
export default async function spawnAsync(
  command: string,
  args: readonly string[] = [],
  options: SpawnOptions = {}
): Promise<string> {
  const promise = new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    let stdout = '';
    let stderr = '';

    if (child.stdout) {
      child.stdout.on('data', (data) => {
        stdout += data;
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        stderr += data;
      });
    }

    const completionListener = (code: number | null, signal: string | null) => {
      child.removeListener('error', errorListener);
      if (code !== 0) {
        reject(
          signal
            ? new Error(`${command} exited with signal: ${signal}\n${stderr}`)
            : new Error(`${command} exited with non-zero code: ${code}\n${stderr}`)
        );
      } else {
        resolve(stdout);
      }
    };

    let errorListener = (error: Error) => {
      child.removeListener('close', completionListener);
      reject(error);
    };

    child.once('close', completionListener);
    child.once('error', errorListener);
  }) as Promise<string>;
  return promise;
}
