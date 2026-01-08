import { ChildProcess, spawn } from 'node:child_process';
import { RunCommandOptions, RunCommandResult } from './types';

let subprocess: ChildProcess | null = null;
let isExiting = false;

const killChildProcess = () => {
  if (subprocess != null && !subprocess.killed && !isExiting) {
    isExiting = true;
    console.log('\n');
    console.error('Command interrupted');
    subprocess.kill('SIGTERM');

    const forceKillTimeout = setTimeout(() => {
      if (subprocess != null && !subprocess.killed) {
        subprocess.kill('SIGKILL');
      }
      process.exit(130);
    }, 2000);

    subprocess.once('exit', () => {
      clearTimeout(forceKillTimeout);
      process.exit(130);
    });
  }
};

process.on('SIGINT', killChildProcess);
process.on('SIGTERM', killChildProcess);
process.on('SIGQUIT', killChildProcess);

export const runCommand = (
  command: string,
  args: string[] = [],
  options?: RunCommandOptions,
): Promise<RunCommandResult> => {
  return new Promise((resolve, reject) => {
    const stdio = options?.verbose ? 'inherit' : 'pipe';

    const childProc = spawn(command, args, {
      stdio,
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        ...(options?.env ?? {}),
      },
      cwd: options?.cwd,
    });
    subprocess = childProc;

    let stdOut = '';
    let stdErr = '';

    if (!options?.verbose) {
      childProc.stdout?.on('data', (data) => {
        stdOut += data.toString();
      });

      childProc.stderr?.on('data', (chunk) => {
        stdErr += chunk;
      });
    }

    childProc.on('close', (code) => {
      subprocess = null;
      if (isExiting) {
        return;
      }
      if (code === 0) {
        resolve({ stdout: stdOut });
      } else if (code === null) {
        process.exit(130);
      } else {
        const errorMessage = `Command '${command} ${args.join(' ')}' failed with code ${code}
        \n${stdErr}`;
        reject(errorMessage);
      }
    });

    childProc.on('error', (error) => {
      subprocess = null;
      if (isExiting) {
        return;
      }
      reject(error);
    });

    childProc.on('exit', () => {
      subprocess = null;
    });
  });
};
