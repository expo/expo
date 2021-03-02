import chalk from 'chalk';
import ora from 'ora';

import logger from './Logger';

export type SpinnerParams =
  | {
      text: string;
    }
  | {
      command: string;
    };

function isCommand(obj: SpinnerParams): obj is { command: string } {
  return obj.hasOwnProperty('command');
}

/**
 * Decorating function that adds CLI spinner for long-running wrapped function.
 * If wrapped function throws an error, this wrapper stops the program logging the cause.
 */
export function withSpinner<T extends any[], U>(
  spinnerParams: SpinnerParams,
  wrappedFunction: (...args: T) => Promise<U>
) {
  const text = isCommand(spinnerParams)
    ? `Executing ${chalk.yellow(spinnerParams.command)}`
    : chalk.yellow(spinnerParams.text);
  return async (...args: T): Promise<U> => {
    const spinner = ora({
      spinner: 'dots',
      text: `${text}. This might take a while ...`,
    }).start();
    try {
      const result = await wrappedFunction(...args);
      spinner.succeed();
      return result;
    } catch (e) {
      spinner.fail();
      logger.error('Failed with an error.', e);
      process.exit(1);
    }
  };
}
