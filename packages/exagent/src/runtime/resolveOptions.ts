// @ref llp/0005-runtime-loop-tools.rfc.md
// Argument resolution for the `exagent runtime:<action>` commands. Pure: argv in, options out,
// `CommandError` for anything a user can get wrong, so every flag combination is unit-testable.

import {
  DURATION_METAVAR,
  parseArgsOrThrow,
  resolveDuration,
  strayArgumentError,
} from '../utils/args';
import { CommandError } from '../utils/errors';
import { resolveDevServerUrlFlag } from './devServer';

/** Actions of the `runtime` group, in the order the help prints them. */
export const RUNTIME_ACTIONS = ['eval', 'errors', 'network'] as const;

export type RuntimeAction = (typeof RUNTIME_ACTIONS)[number];

/** What every runtime action shares: which dev server to talk to, and how to report. */
interface RuntimeSharedOptions {
  /**
   * The `--dev-server-url` the caller named, or null when they named none.
   *
   * Null is not "the default port": it means the dev server is still to be found, which is what
   * lets the command consult the project's dev-server lock and then fall back to a scan
   * (`discoverDevServerAsync`). An explicit URL is used as given, and never scanned around.
   */
  devServerUrl: string | null;
}

export interface RuntimeEvalOptions extends RuntimeSharedOptions {
  action: 'eval';
  /** JavaScript expression to evaluate in the app. */
  expression: string;
  timeoutMs: number;
  /** Wait for a returned promise to settle and report the settled value. */
  awaitPromise: boolean;
  json: boolean;
}

export interface RuntimeErrorsOptions extends RuntimeSharedOptions {
  action: 'errors';
  /** How long to listen for runtime errors, in milliseconds. */
  durationMs: number;
  json: boolean;
  /** Attach the state-aware next actions to the output, cleared by `--no-followups`. */
  followups: boolean;
}

export interface RuntimeNetworkOptions extends RuntimeSharedOptions {
  action: 'network';
  /** How long to listen for network requests, in milliseconds. */
  durationMs: number;
  json: boolean;
  /** Attach the state-aware next actions to the output, cleared by `--no-followups`. */
  followups: boolean;
}

export type RuntimeCommandOptions =
  | RuntimeEvalOptions
  | RuntimeErrorsOptions
  | RuntimeNetworkOptions;

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

// `errors` and `network` both listen over a window and both report follow-ups, so they share one
// flag set. `eval` does not take `--no-followups`: there it would be a flag that does nothing, and
// an unknown flag is a clearer answer than a silent no-op.
const WINDOW_ARGS = {
  ...SHARED_ARGS,
  '--duration': String,
  '--no-followups': Boolean,
};

/**
 * Default window per listening action.
 *
 * Network activity is sparser than errors — a screen often makes one request after a tap — so its
 * window is longer, or the usual answer would be an empty report.
 */
const DEFAULT_WINDOW_MS: Record<'errors' | 'network', number> = {
  errors: 2000,
  network: 5000,
};

/**
 * Resolve the arguments of `exagent runtime:<action>`.
 *
 * The action arrives as the first argument, whichever spelling the caller used: the command
 * registry hands `runtime:eval` and `runtime eval` over the same way.
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
      `Missing action. Usage: npx exagent runtime:<${RUNTIME_ACTIONS.join('|')}>`
    );
  }
  if (!RUNTIME_ACTIONS.includes(action as RuntimeAction)) {
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
        `Missing expression. Usage: npx exagent runtime:eval "<expression>"`
      );
    }
    if (positional.length > 1) {
      throw new CommandError(
        'BAD_ARGS',
        `Expected one expression, but got ${positional.length} arguments (${positional.join(' ')}). Quote the expression so the shell passes it as one argument: npx exagent runtime:eval "${positional.join(' ')}"`
      );
    }

    return {
      action: 'eval',
      expression: positional[0]!,
      devServerUrl: resolveExplicitDevServerUrl(args['--dev-server-url']),
      timeoutMs: resolveDuration(args['--timeout'], '--timeout', 5000, { allowZero: false }),
      awaitPromise: !args['--no-await-promise'],
      json: !!args['--json'],
    };
  }

  const windowAction = action as 'errors' | 'network';
  const args = parseArgsOrThrow(WINDOW_ARGS, argv);
  const positional = args._.slice(1);
  if (positional.length > 0) {
    throw strayArgumentError(`runtime:${windowAction}`, positional, {
      hint: `this command listens over a window and takes no target. Usage: npx exagent runtime:${windowAction} [--duration ${DURATION_METAVAR}]`,
    });
  }

  return {
    action: windowAction,
    devServerUrl: resolveExplicitDevServerUrl(args['--dev-server-url']),
    durationMs: resolveDuration(args['--duration'], '--duration', DEFAULT_WINDOW_MS[windowAction], {
      allowZero: true,
    }),
    json: !!args['--json'],
    followups: !args['--no-followups'],
  };
}

/**
 * The `--dev-server-url` the caller named, validated, or null when they named none.
 *
 * The validation is unchanged — a value that is not an http(s) URL is still `BAD_ARGS` — only the
 * absent case differs: it resolves to nothing to find rather than to the default port.
 */
function resolveExplicitDevServerUrl(value: unknown): string | null {
  return value == null ? null : resolveDevServerUrlFlag(value);
}
