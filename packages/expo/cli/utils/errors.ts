import { JSONValue } from '@expo/json-file';
import { AssertionError } from 'assert';
import chalk from 'chalk';
import { HTTPError, RequestError } from 'got/dist/source';

import { exit } from '../log';
import { EXPO_DEBUG } from './env';

export class ApiV2Error extends RequestError {
  readonly name = 'ApiV2Error';
  readonly expoApiV2ErrorCode: string;
  readonly expoApiV2ErrorDetails?: JSONValue;
  readonly expoApiV2ErrorServerStack?: string;
  readonly expoApiV2ErrorMetadata?: object;

  constructor(
    originalError: HTTPError,
    response: {
      message: string;
      code: string;
      stack?: string;
      details?: JSONValue;
      metadata?: object;
    }
  ) {
    super(response.message, originalError, originalError.request);
    this.expoApiV2ErrorCode = response.code;
    this.expoApiV2ErrorDetails = response.details;
    this.expoApiV2ErrorServerStack = response.stack;
    this.expoApiV2ErrorMetadata = response.metadata;
  }
}

const ERROR_PREFIX = 'Error: ';

/**
 * General error, formatted as a message in red text when caught by expo-cli (no stack trace is printed). Should be used in favor of `log.error()` in most cases.
 */
export class CommandError extends Error {
  name = 'CommandError';
  readonly isCommandError = true;

  constructor(public code: string, message: string = '') {
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

export function logCmdError(error: Error): never {
  if (error instanceof AbortCommandError || error instanceof SilentError) {
    // Do nothing, this is used for prompts or other cases that were custom logged.
    process.exit(0);
  } else if (
    error instanceof CommandError ||
    error instanceof AssertionError ||
    error instanceof ApiV2Error
  ) {
    // Print the stack trace in debug mode only.
    exit(chalk.red(error.toString()) + (EXPO_DEBUG ? '\n' + chalk.gray(error.stack) : ''));
  }

  exit(chalk.red(error.toString()) + '\n' + chalk.gray(error.stack));
}
