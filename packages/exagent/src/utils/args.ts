// Common utilities for interacting with `args` library.
// These functions should be used by every command.
import arg from 'arg';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { resolve } from 'path';

import * as Log from '../log';
import { CommandError } from './errors';

/**
 * Parse the first argument as a project directory.
 *
 * @returns valid project directory.
 */
export function getProjectRoot(args: arg.Result<arg.Spec>) {
  const projectRoot = resolve(args._[0] || '.');

  if (!existsSync(projectRoot)) {
    Log.exit(`Invalid project root: ${projectRoot}`);
  }

  return projectRoot;
}

/**
 * Parse args and assert unknown options.
 *
 * @param schema the `args` schema for parsing the command line arguments.
 * @param argv extra strings
 * @returns processed args object.
 */
export function assertArgs(schema: arg.Spec, argv?: string[]): arg.Result<arg.Spec> {
  return assertWithOptionsArgs(schema, { argv });
}

export function assertWithOptionsArgs(
  schema: arg.Spec,
  options: arg.Options
): arg.Result<arg.Spec> {
  try {
    return arg(schema, options);
  } catch (error: any) {
    // Handle errors caused by user input.
    // Only errors from `arg`, which does not start with `ARG_CONFIG_` are user input errors.
    // See: https://github.com/vercel/arg/releases/tag/5.0.0
    if ('code' in error && error.code.startsWith('ARG_') && !error.code.startsWith('ARG_CONFIG_')) {
      Log.exit(error.message, 1);
    }
    // Otherwise rethrow the error.
    throw error;
  }
}

/**
 * Parse args and report unknown options as a `CommandError` instead of exiting.
 *
 * Use this when the arguments of a subcommand are resolved by a pure function: the caller keeps
 * one error path for both a bad flag and a bad value, and the resolver stays testable.
 */
export function parseArgsOrThrow(schema: arg.Spec, argv: string[]): arg.Result<arg.Spec> {
  try {
    return arg(schema, { argv, permissive: false });
  } catch (error: any) {
    // Only errors from `arg` that do not start with `ARG_CONFIG_` are user input errors.
    // See: https://github.com/vercel/arg/releases/tag/5.0.0
    if ('code' in error && error.code.startsWith('ARG_') && !error.code.startsWith('ARG_CONFIG_')) {
      throw new CommandError('BAD_ARGS', error.message);
    }
    throw error;
  }
}

/**
 * Read a duration flag in milliseconds, or fall back when the caller named none.
 *
 * The value arrives as a string rather than through a numeric `arg` handler, so an unusable one is
 * reported as the user typed it instead of as the `NaN` a handler would have produced.
 *
 * Every command that waits takes one of these, so the rule lives here: one spelling of the error,
 * one answer for `0`, and one place to change either.
 *
 * @param value The raw flag value, or null/undefined when it was not passed.
 * @param flag The flag name, for the error message, e.g. `--timeout`.
 * @param fallback The duration to use when the flag was not passed.
 * @param allowZero Whether `0` is a duration this flag accepts, e.g. a window that collects
 *   nothing. A timeout of `0` is a mistake, so the flags that mean "wait" reject it.
 * @throws {CommandError} `BAD_ARGS` for a value that is not a usable duration.
 */
export function resolveDuration(
  value: unknown,
  flag: string,
  fallback: number,
  { allowZero }: { allowZero: boolean }
): number {
  if (value == null) {
    return fallback;
  }
  const duration = Number(value);
  if (!Number.isFinite(duration) || duration < 0 || (!allowZero && duration <= 0)) {
    throw new CommandError(
      'BAD_ARGS',
      `${flag} must be a duration in milliseconds${allowZero ? ' of 0 or more' : ' greater than 0'}, but got ${value}.`
    );
  }
  return duration;
}

export function printHelp(info: string, usage: string, options: string, extra: string = ''): never {
  Log.exit(
    chalk`
  {bold Info}
    ${info}

  {bold Usage}
    {dim $} ${usage}

  {bold Options}
    ${options.split('\n').join('\n    ')}
` + extra,
    0
  );
}
