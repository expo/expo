import { spawn } from 'child_process';

/** Runs a command inside a workspace, capturing output; throws on non-zero exit. */
export async function runCommandAsync(
  root: string,
  command: string,
  args: string[],
  timeoutSeconds: number
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: { ...process.env, CI: '1', EXPO_NO_TELEMETRY: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`${command} ${args.join(' ')} timed out after ${timeoutSeconds}s`));
    }, timeoutSeconds * 1000);
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(`${command} ${args.join(' ')} exited with ${code}:\n${output.slice(-4000)}`)
        );
      }
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(new Error(`Could not run ${command}: ${error}`));
    });
  });
}
