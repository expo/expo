import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';

/** Ends the step with this exit status. What failed has already printed why. */
export class ExitError extends Error {
  constructor(readonly status: number) {
    super(`The step ends with exit status ${status}.`);
  }
}

/** Ends the step with exit status 1 after it prints `error: <message>`. */
export class FatalError extends Error {}

export type Output = {
  log(line: string): Promise<void>;
  error(line: string): Promise<void>;
  /** Prints text that a pull request author controls. */
  untrusted(text: string, stream?: 'stdout' | 'stderr'): Promise<void>;
};

function writeAsync(stream: NodeJS.WriteStream, text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    stream.write(text, (error) => (error ? reject(error) : resolve()));
  });
}

/**
 * Each write finishes before the call returns, so that it comes before the output of the next child
 * process that shares the stream.
 */
export function createOutput(env: NodeJS.ProcessEnv): Output {
  const streams = { stdout: process.stdout, stderr: process.stderr };
  return {
    log: (line) => writeAsync(process.stdout, `${line}\n`),
    error: (line) => writeAsync(process.stderr, `${line}\n`),
    // Text from a pull request can hold GitHub Actions workflow commands, such as `::add-mask::`.
    // The runner reads no commands while that text prints.
    untrusted: (text, stream = 'stdout') => {
      if (!env.GITHUB_ACTIONS) {
        return writeAsync(streams[stream], text);
      }
      const token = randomBytes(16).toString('hex');
      return writeAsync(streams[stream], `::stop-commands::${token}\n${text}::${token}::\n`);
    },
  };
}

/** Prints why the step failed, once, and returns the error that ends the step. */
export async function reportFailureAsync(error: unknown, output: Output): Promise<ExitError> {
  if (error instanceof ExitError) {
    return error;
  }
  if (error instanceof FatalError) {
    await output.error(`error: ${error.message}`);
  } else {
    await output.untrusted(`${error instanceof Error ? error.stack : String(error)}\n`, 'stderr');
  }
  return new ExitError(1);
}

export type RunOptions = {
  /** `inherit` prints the output of the command as it runs. Default: `pipe`, which returns it. */
  stdout?: 'pipe' | 'inherit';
  /** `ignore` discards the errors of a command whose failure is an answer. Default: `inherit`. */
  stderr?: 'inherit' | 'ignore';
  /** Writes stdout and stderr together to this file, in the order the command writes them. */
  logFile?: string;
};

export type RunResult = { status: number; stdout: string };

/** Runs a program with the given arguments, never through a shell. */
export class Cli {
  constructor(
    readonly command: string,
    readonly prefix: readonly string[] = []
  ) {}

  /** Returns the exit status instead of failing. */
  async tryAsync(args: readonly string[], options: RunOptions = {}): Promise<RunResult> {
    const log = options.logFile ? await fs.promises.open(options.logFile, 'w') : null;
    try {
      const child = spawn(this.command, [...this.prefix, ...args], {
        stdio: [
          'ignore',
          log?.fd ?? options.stdout ?? 'pipe',
          log?.fd ?? options.stderr ?? 'inherit',
        ],
      });
      const chunks: Buffer[] = [];
      child.stdout?.on('data', (chunk: Buffer) => chunks.push(chunk));
      const status = await new Promise<number>((resolve, reject) => {
        child.on('error', reject);
        child.on('close', (code, signal) => {
          resolve(code ?? 128 + (signal ? os.constants.signals[signal] : 0));
        });
      });
      return { status, stdout: Buffer.concat(chunks).toString('utf8') };
    } finally {
      await log?.close();
    }
  }

  /** Fails the step with the exit status of the command when the command fails. */
  async runAsync(args: readonly string[], options: RunOptions = {}): Promise<RunResult> {
    const result = await this.tryAsync(args, options);
    if (result.status !== 0) {
      throw new ExitError(result.status);
    }
    return result;
  }

  /** Returns stdout without its trailing newlines, as a shell command substitution does. */
  async outputAsync(args: readonly string[]): Promise<string> {
    return stripTrailingNewlines((await this.runAsync(args)).stdout);
  }
}

export function stripTrailingNewlines(text: string): string {
  return text.replace(/\n+$/, '');
}
