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
 * Units a duration flag may be spelled with, as the milliseconds one of them is worth.
 *
 * A bare number stays milliseconds, which is what every flag meant before the units existed and
 * what a value computed by a caller still is. The suffixes exist for the durations a person types:
 * `--timeout 2700000` and `--timeout 45m` are the same wait, and only one of them can be read back.
 */
const DURATION_UNITS: Record<string, number> = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
};

/** A number with one of {@link DURATION_UNITS} attached, e.g. `90s`. */
const DURATION_WITH_UNIT = /^(\d+(?:\.\d+)?)(ms|s|m|h)$/;

/**
 * The metavariable every duration flag prints in its `--help` option line.
 *
 * `<ms>` was a lie of omission: the flags have accepted `90s` and `2h` since the units existed, and
 * an agent that copies the stated type never tries anything else. One spelling here means a flag
 * that starts accepting durations cannot document itself as milliseconds by accident.
 */
export const DURATION_METAVAR = '<duration>';

/**
 * The line a `--help` prints once to say what {@link DURATION_METAVAR} accepts.
 *
 * Kept next to {@link resolveDuration} and to the error it throws, so the three spellings a user
 * can meet — the option line, this note, and the rejection — cannot drift apart.
 */
export const DURATION_HELP_NOTE =
  'Durations are milliseconds, or a number with a unit: 90s, 30m, 2h.';

/**
 * Read a duration flag in milliseconds, or fall back when the caller named none.
 *
 * The value arrives as a string rather than through a numeric `arg` handler, so an unusable one is
 * reported as the user typed it instead of as the `NaN` a handler would have produced.
 *
 * A bare number is milliseconds; `90s`, `30m` and `2h` are the same duration spelled the way a
 * person says it. Nothing else is accepted, so a typo is an error rather than a silently truncated
 * number — `Number('45min')` is `NaN`, but `parseInt` would have made it 45.
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
  const duration = parseDuration(value);
  if (!Number.isFinite(duration) || duration < 0 || (!allowZero && duration <= 0)) {
    throw new CommandError(
      'BAD_ARGS',
      `${flag} must be a duration${allowZero ? ' of 0 or more' : ' greater than 0'} — milliseconds, or a number with a unit like 90s, 30m or 2h — but got ${value}.`
    );
  }
  return duration;
}

/** The milliseconds a duration value is worth, or `NaN` when it is not one. */
function parseDuration(value: unknown): number {
  if (typeof value === 'string') {
    const match = DURATION_WITH_UNIT.exec(value.trim());
    if (match) {
      return Number(match[1]) * DURATION_UNITS[match[2]!]!;
    }
  }
  return Number(value);
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
