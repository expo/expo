import { AssertionError } from 'assert';
import chalk from 'chalk';

import { exit } from './log';

const ERROR_PREFIX = 'Error: ';

/**
 * General error, formatted as a message in red text when caught by expo-cli (no stack trace is printed). Should be used in favor of `log.error()` in most cases.
 */
export class CommandError extends Error {
  name = 'CommandError';
  readonly isCommandError = true;

  constructor(
    public code: string,
    message: string = ''
  ) {
    super('');
    // If e.toString() was called to get `message` we don't want it to look
    // like "Error: Error:".
    if (message.startsWith(ERROR_PREFIX)) {
      message = message.substring(ERROR_PREFIX.length);
    }

    this.message = message || code;
  }
}

export function logCmdError(error: any): never {
  if (!(error instanceof Error)) {
    throw error;
  }

  if (error instanceof CommandError || error instanceof AssertionError) {
    // Print the stack trace in debug mode only.
    exit(error);
  }

  const errorDetails = error.stack ? '\n' + chalk.gray(error.stack) : '';

  exit(chalk.red(error.toString()) + errorDetails);
}
