// Common utilities for interacting with `args` library.
// These functions should be used by every command.
import arg from 'arg';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { resolve } from 'path';

import * as Log from '../log';
import { PROGRAM_NAME, PROGRAM_PREFIX } from '../programName';
import { CommandError } from './errors';
import { argParseError } from './unknownOption';

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
 * What a command does with the arguments that are not options.
 *
 * Stated per command rather than inferred, and with no default, so the type checker asks the
 * question of every command that parses arguments — including the next one somebody writes.
 * `@expo/agent-cli checkpoint:undo <id>` accepted an argument it had no place for, dropped it, and
 * restored the newest checkpoint over the working tree while reporting success. That command was
 * deferred out of v1 (llp/0016); the rule it forced applies to every command with no positional.
 *
 * @ref llp/0010-agent-conventions.rfc.md §Registry rules
 */
export type PositionalArgPolicy =
  /**
   * This command reads no positional arguments, so one that arrives is a `BAD_ARGS` error.
   *
   * Only usable on a non-permissive parse: `arg` puts unrecognized *options* into `_` when
   * `permissive` is set, and rejecting those as positionals would reject the flags the command's
   * own resolver goes on to read.
   */
  | 'none'
  /**
   * This command reads `args._` itself and validates it there, e.g. `navigate <route>`, or hands
   * the arguments to another CLI that reports its own (`start`).
   */
  | 'own';

export interface AssertArgsOptions extends arg.Options {
  /** The command as a caller types it, e.g. `checkpoint:undo`. Printed by the errors below. */
  command: string;
  /** What this command does with the arguments that are not options. */
  positionalArgs: PositionalArgPolicy;
  /**
   * One sentence for the caller who passed a positional argument to a `'none'` command, naming
   * what they probably meant — the flag that carries the value, most often.
   */
  strayHint?: string;
}

/**
 * Parse args, assert unknown options, and reject the positional arguments the command has no
 * place for.
 *
 * @param schema the `args` schema for parsing the command line arguments.
 * @param options the `arg` options, plus the command's name and its positional-argument policy.
 * @returns processed args object.
 */
export function assertWithOptionsArgs(
  schema: arg.Spec,
  options: AssertArgsOptions
): arg.Result<arg.Spec> {
  const { command, positionalArgs, strayHint, ...argOptions } = options;

  let result: arg.Result<arg.Spec>;
  try {
    result = arg(schema, argOptions);
  } catch (error: any) {
    // Handle errors caused by user input.
    // Only errors from `arg`, which does not start with `ARG_CONFIG_` are user input errors.
    // See: https://github.com/vercel/arg/releases/tag/5.0.0
    if (
      !('code' in error) ||
      !error.code.startsWith('ARG_') ||
      error.code.startsWith('ARG_CONFIG_')
    ) {
      // Not the user's mistake: this CLI's own schema is wrong, and that is a crash.
      throw error;
    }
    // Thrown, not printed and exited: `cli.ts` catches what a command rejects with and runs it
    // through `logCmdError`, which is what attaches the `cli:error` event, the `Try:` line, the
    // exit code and the `--json` envelope. This used to call `Log.exit` with the parser's own
    // sentence, so a `--json` run printed nothing at all on stdout (llp/0010 §The `--json` error
    // envelope) [observed — friction run 4, 2026-08-23: `typecheck --json --bogus`].
    throw argParseError(command, error.message, error.code);
  }

  // The check runs after the parse and before the command's `--help` branch, so a run with both a
  // stray argument and `--help` still prints the help — a caller reading the usage is not the one
  // this protects.
  if (positionalArgs === 'none' && !result['--help'] && result._.length > 0) {
    // Thrown, like the parse failure above: `logCmdError` flushes the event log before it exits, so
    // it does not end the process on this tick — reporting here and carrying on meant the command
    // body ran anyway, in the window before the exit fired.
    throw strayArgumentError(command, result._, { hint: strayHint });
  }

  return result;
}

/**
 * The error for an argument a command has no place for.
 *
 * Shared by {@link assertWithOptionsArgs} and by the `resolve*Options` functions of the commands
 * that parse permissively, so the one mistake reads the same wherever it is caught.
 *
 * @param command the command as a caller types it, e.g. `checkpoint:undo`.
 * @param positional the arguments that were not options, as `arg` collected them.
 * @param options.hint one sentence naming what the caller probably meant.
 */
export function strayArgumentError(
  command: string,
  positional: readonly (string | number)[],
  { hint }: { hint?: string } = {}
): CommandError {
  const stray = positional.map(String);
  const error = new CommandError(
    'BAD_ARGS',
    [
      `Unexpected argument: ${stray[0]}. "${PROGRAM_NAME} ${command}" reads no positional arguments${stray.length > 1 ? `, and ${stray.length} were passed (${stray.join(' ')})` : ''}.`,
      `Why: nothing in this command consumes it, so it would have been dropped and the command would have run as if it were not there — and reported success.`,
      hint
        ? `How: ${hint}`
        : `How: run "${PROGRAM_PREFIX} ${command} --help" for the options this command does take.`,
    ].join('\n')
  );
  error.suggestedCommand = `${PROGRAM_PREFIX} ${command} --help`;
  return error;
}

/**
 * Parse args and report unknown options as a `CommandError` instead of exiting.
 *
 * Use this when the arguments of a subcommand are resolved by a pure function: the caller keeps
 * one error path for both a bad flag and a bad value, and the resolver stays testable.
 *
 * @param command the command as a caller types it, e.g. `dev:stop`. Required, and not inferred,
 * because it is what the error names — both in the `Try:` line and in the sentence that says which
 * *other* command takes the option ({@link import('./unknownOption').OPTION_OWNERS}).
 */
export function parseArgsOrThrow(
  schema: arg.Spec,
  argv: string[],
  command: string
): arg.Result<arg.Spec> {
  try {
    return arg(schema, { argv, permissive: false });
  } catch (error: any) {
    // Only errors from `arg` that do not start with `ARG_CONFIG_` are user input errors.
    // See: https://github.com/vercel/arg/releases/tag/5.0.0
    if ('code' in error && error.code.startsWith('ARG_') && !error.code.startsWith('ARG_CONFIG_')) {
      throw argParseError(command, error.message, error.code);
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

/**
 * @deprecated Use `printCommandHelp` from `src/help/format.ts`.
 *
 * The free-form help block every command used to build for itself: an `Info` line, a usage line,
 * an option list, and an `extra` string that grew into sixty lines of rationale. One shape per
 * command is a shape nothing can check, which is why the registry now requires a `CommandHelp`
 * (llp/0024). Nothing under a registry entry calls this — only `src/deferred/`, the v1 narrowing's
 * reference shelf (llp/0016), which is kept verbatim and loaded by nothing.
 */
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
