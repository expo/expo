import chalk from 'chalk';

// NOTE(@kitten): LogRespectingTerminal in instantiateMetro regressed on fatal errors and
// logs may be swallowed before exiting. We redirect them to a direct write when we're about to exit
let isExiting = false;

export function time(label?: string): void {
  console.time(label);
}

export function timeEnd(label?: string): void {
  console.timeEnd(label);
}

export function error(...message: string[]): void {
  if (isExiting) {
    // `console.error` may be patched to route through an async stderr queue
    // (see LogRespectingTerminal in instantiateMetro.ts). On the exit path
    // that queue has no chance to drain before `process.exit`, so write
    // synchronously to bypass it.
    process.stderr.write(message.join(' ') + '\n');
    return;
  }
  console.error(...message);
}

/** Print an error and provide additional info (the stack trace) in debug mode. */
export function exception(e: Error): void {
  const { env } = require('./utils/env');
  error(chalk.red(e.toString()) + (env.EXPO_DEBUG ? '\n' + chalk.gray(e.stack) : ''));
}

export function warn(...message: string[]): void {
  if (isExiting) {
    process.stderr.write(message.map((value) => chalk.yellow(value)).join(' ') + '\n');
    return;
  }
  console.warn(...message.map((value) => chalk.yellow(value)));
}

export function log(...message: string[]): void {
  if (isExiting) {
    process.stdout.write(message.join(' ') + '\n');
    return;
  }
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
  isExiting = true;
  if (message instanceof Error) {
    exception(message);
  } else if (message) {
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
