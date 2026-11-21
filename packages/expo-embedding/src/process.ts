import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

type Options = { cwd?: string; env?: NodeJS.ProcessEnv };
const execFileAsync = promisify(execFile);

export async function readCommandOutput(
  command: string,
  args: string[],
  options: Options & { maxBuffer?: number } = {}
): Promise<string> {
  const { stdout } = await execFileAsync(command, args, {
    maxBuffer: 64 * 1024 * 1024,
    ...options,
    encoding: 'utf8',
  });
  return stdout;
}

export async function runCommand(command: string, args: string[], options: Options): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: 'inherit' });
    child.once('error', reject);
    child.once('close', (code, signal) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(
            `${command} failed (${signal ?? `exit ${code}`}). Fix the reported error and retry the command.`
          )
        );
    });
  });
}
