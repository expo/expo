import chalk from 'chalk';

import { ExitError } from './error';

export function error(...message: string[]): void {
  console.error(...message);
}

/** Print an error and provide additional info (the stack trace) in debug mode. */
export function exception(e: Error): void {
  const { env } = require('./utils/env');
  error(chalk.red(e.toString()) + (env.EXPO_DEBUG ? '\n' + chalk.gray(e.stack) : ''));
}

export function log(...message: string[]): void {
  console.log(...message);
}

/** Log a message and exit the current process. If the `code` is non-zero then `console.error` will be used instead of `console.log`. */
export function exit(message: string | Error, code: number = 1): never {
  if (message instanceof Error) {
    exception(message);
  } else if (message) {
    if (code === 0) {
      log(message);
    } else {
      error(message);
    }
  }

  if (code !== 0) {
    throw new ExitError(message, code);
  }
  process.exit(code);
}

// The re-export makes auto importing easier.
export const Log = {
  error,
  exception,
  log,
  exit,
};
