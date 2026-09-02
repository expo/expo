// @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization
// Argument resolution for `@expo/agent-cli dev:logs`. Pure: argv in, options out, `CommandError` for
// anything a user can get wrong.

import { PROGRAM_PREFIX } from '../programName';
import { parseArgsOrThrow, strayArgumentError } from '../utils/args';
import { CommandError } from '../utils/errors';

/**
 * How many lines are printed when the caller names no `--tail`.
 *
 * Enough to hold a Metro start-up and the error that follows it, and few enough that a driving
 * agent's context is not spent on a bundler's progress lines.
 */
export const DEFAULT_LOG_TAIL_LINES = 100;

/** Cap on `--tail`, so `--tail 1e9` is a mistake reported here rather than a file read twice. */
const MAX_LOG_TAIL_LINES = 100_000;

export interface DevLogsOptions {
  /** How many lines from the end of the log to print. */
  tail: number;
  /** Print the whole read as one JSON object instead of the lines themselves. */
  json: boolean;
  /** Attach the state-aware next actions to the output, cleared by `--no-followups`. */
  followups: boolean;
}

const LOGS_ARGS = {
  // Read as a string so an unusable value is reported as the user typed it.
  '--tail': String,
  '--json': Boolean,
  '--no-followups': Boolean,
};

/**
 * Resolve the arguments of `@expo/agent-cli dev:logs`.
 *
 * @throws {CommandError} `BAD_ARGS` for an unknown flag, an unusable `--tail`, or a stray argument.
 */
export function resolveDevLogsOptions(argv: string[]): DevLogsOptions {
  const args = parseArgsOrThrow(LOGS_ARGS, argv, 'dev:logs');
  if (args._.length > 0) {
    throw strayArgumentError('dev:logs', args._, {
      hint: `this command reads the log of this project's own detached dev server and takes no target. To read fewer or more lines, pass --tail ${args._[0]}.`,
    });
  }

  return {
    tail: resolveTail(args['--tail']),
    json: !!args['--json'],
    followups: !args['--no-followups'],
  };
}

/**
 * Read `--tail`.
 *
 * `0` is rejected: a run that prints no lines is indistinguishable from a log that has none, and
 * the caller asking for it almost certainly meant `--json` and the file path.
 */
function resolveTail(value: unknown): number {
  if (value == null) {
    return DEFAULT_LOG_TAIL_LINES;
  }
  const tail = Number(value);
  if (!Number.isInteger(tail) || tail < 1 || tail > MAX_LOG_TAIL_LINES) {
    throw new CommandError(
      'BAD_ARGS',
      [
        `--tail must be a whole number of lines from 1 to ${MAX_LOG_TAIL_LINES}, but got ${String(value) || '(nothing)'}.`,
        `Why: it is how many lines from the end of the log to print, and a log has a whole number of them.`,
        `How: pass one, as in "${PROGRAM_PREFIX} dev:logs --tail 200". Leaving it out prints the last ${DEFAULT_LOG_TAIL_LINES}.`,
      ].join('\n')
    );
  }
  return tail;
}
