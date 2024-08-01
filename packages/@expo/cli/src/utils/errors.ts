import { AssertionError } from 'assert';
import chalk from 'chalk';

import { exit } from '../log';

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

export class AbortCommandError extends CommandError {
  constructor() {
    super('ABORTED', 'Interactive prompt was cancelled.');
  }
}

/**
 * Used to end a CLI process without printing a stack trace in the Expo CLI. Should be used in favor of `process.exit`.
 */
export class SilentError extends CommandError {
  constructor(messageOrError?: string | Error) {
    const message =
      (typeof messageOrError === 'string' ? messageOrError : messageOrError?.message) ??
      'This error should fail silently in the CLI';
    super('SILENT', message);
    if (typeof messageOrError !== 'string') {
      // forward the props of the incoming error for tests or processes outside of expo-cli that use expo cli internals.
      this.stack = messageOrError?.stack ?? this.stack;
      this.name = messageOrError?.name ?? this.name;
    }
  }
}

export function logCmdError(error: any): never {
  if (!(error instanceof Error)) {
    throw error;
  }
  if (error instanceof AbortCommandError || error instanceof SilentError) {
    // Do nothing, this is used for prompts or other cases that were custom logged.
    process.exit(0);
  } else if (
    error instanceof CommandError ||
    error instanceof AssertionError ||
    error.name === 'ApiV2Error' ||
    error.name === 'ConfigError'
  ) {
    // Print the stack trace in debug mode only.
    exit(error);
  }

  const errorDetails = error.stack ? '\n' + chalk.gray(error.stack) : '';

  exit(chalk.red(error.toString()) + errorDetails);
}

/** This should never be thrown in production. */
export class UnimplementedError extends Error {
  constructor() {
    super('Unimplemented');
    this.name = 'UnimplementedError';
  }
}
