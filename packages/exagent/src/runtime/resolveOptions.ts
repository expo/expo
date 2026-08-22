// @ref llp/0005-runtime-loop-tools.rfc.md
// Argument resolution for `exagent runtime`. Pure: argv in, options out, `CommandError` for
// anything a user can get wrong, so every flag combination is unit-testable.

import { parseArgsOrThrow } from '../utils/args';
import { CommandError } from '../utils/errors';
import { resolveDevServerUrlFlag } from './devServer';

/** Actions of `exagent runtime`, in the order the help prints them. */
export const RUNTIME_ACTIONS = ['eval', 'errors'] as const;

export interface RuntimeEvalOptions {
  action: 'eval';
  /** JavaScript expression to evaluate in the app. */
  expression: string;
  devServerUrl: string;
  timeoutMs: number;
  /** Wait for a returned promise to settle and report the settled value. */
  awaitPromise: boolean;
  json: boolean;
}

export interface RuntimeErrorsOptions {
  action: 'errors';
  devServerUrl: string;
  /** How long to listen for runtime errors, in milliseconds. */
  durationMs: number;
  json: boolean;
}

export type RuntimeCommandOptions = RuntimeEvalOptions | RuntimeErrorsOptions;

const SHARED_ARGS = {
  '--dev-server-url': String,
  '--json': Boolean,
};

// The durations are read as strings so an unusable value is reported as the user typed it,
// instead of as the `NaN` a numeric handler would produce.
const EVAL_ARGS = {
  ...SHARED_ARGS,
  '--timeout': String,
  '--no-await-promise': Boolean,
};

const ERRORS_ARGS = {
  ...SHARED_ARGS,
  '--duration': String,
};

/**
 * Resolve the arguments of `exagent runtime <action>`.
 *
 * Each action has its own flag set, so a flag that belongs to the other action is reported as
 * unknown instead of silently ignored.
 *
 * @throws {CommandError} `BAD_ARGS` for a missing action, an unknown flag, or an unusable value.
 */
export function resolveRuntimeCommand(argv: string[]): RuntimeCommandOptions {
  const action = argv.find((value) => !value.startsWith('-'));
  if (action == null) {
    throw new CommandError(
      'BAD_ARGS',
      `Missing action. Usage: npx exagent runtime <${RUNTIME_ACTIONS.join('|')}>`
    );
  }
  if (action !== 'eval' && action !== 'errors') {
    throw new CommandError(
      'BAD_ARGS',
      `Unknown action: ${action}. Expected one of: ${RUNTIME_ACTIONS.join(', ')}`
    );
  }

  if (action === 'eval') {
    const args = parseArgsOrThrow(EVAL_ARGS, argv);
    const positional = args._.slice(1);
    if (positional.length === 0) {
      throw new CommandError(
        'BAD_ARGS',
        `Missing expression. Usage: npx exagent runtime eval "<expression>"`
      );
    }
    if (positional.length > 1) {
      throw new CommandError(
        'BAD_ARGS',
        `Expected one expression, but got ${positional.length} arguments (${positional.join(' ')}). Quote the expression so the shell passes it as one argument: npx exagent runtime eval "${positional.join(' ')}"`
      );
    }

    return {
      action: 'eval',
      expression: positional[0]!,
      devServerUrl: resolveDevServerUrlFlag(args['--dev-server-url']),
      timeoutMs: resolveDuration(args['--timeout'], '--timeout', 5000, { allowZero: false }),
      awaitPromise: !args['--no-await-promise'],
      json: !!args['--json'],
    };
  }

  const args = parseArgsOrThrow(ERRORS_ARGS, argv);
  const positional = args._.slice(1);
  if (positional.length > 0) {
    throw new CommandError(
      'BAD_ARGS',
      `Unexpected argument: ${positional[0]}. Usage: npx exagent runtime errors [--duration <ms>]`
    );
  }

  return {
    action: 'errors',
    devServerUrl: resolveDevServerUrlFlag(args['--dev-server-url']),
    durationMs: resolveDuration(args['--duration'], '--duration', 2000, { allowZero: true }),
    json: !!args['--json'],
  };
}

function resolveDuration(
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
