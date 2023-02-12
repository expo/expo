import chalk from 'chalk';

export function time(label?: string): void {
  console.time(label);
}

export function timeEnd(label?: string): void {
  console.timeEnd(label);
}

export function error(...message: string[]): void {
  console.error(...message);
}

/** Print an error and provide additional info (the stack trace) in debug mode. */
export function exception(e: Error): void {
  const { env } = require('./utils/env');
  error(chalk.red(e.toString()) + (env.EXPO_DEBUG ? '\n' + chalk.gray(e.stack) : ''));
}

export function warn(...message: string[]): void {
  console.warn(...message.map((value) => chalk.yellow(value)));
}

export function log(...message: string[]): void {
  console.log(...message);
}

/** @deprecated use `debug` package with the `expo:` prefix instead.  */
export function debug(...message: any[]): void {
  if (require('./utils/env').env.EXPO_DEBUG) console.log(...message);
}

/** Clear the terminal of all text. */
export function clear(): void {
  process.stdout.write(process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H');
}

/** Log a message and exit the current process. If the `code` is non-zero then `console.error` will be used instead of `console.log`. */
export function exit(message: string | Error, code: number = 1): never {
  if (message instanceof Error) {
    exception(message);
    process.exit(code);
  }

  if (message) {
    if (code === 0) {
      log(message);
    } else {
      error(message);
    }
  }

  process.exit(code);
}

// The re-export makes auto importing easier.
export const Log = {
  time,
  timeEnd,
  error,
  exception,
  warn,
  log,
  debug,
  clear,
  exit,
};
