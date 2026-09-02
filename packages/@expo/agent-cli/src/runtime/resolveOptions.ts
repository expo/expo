// @ref llp/0005-runtime-loop-tools.rfc.md
// Argument resolution for the `@expo/agent-cli runtime:<action>` commands. Pure: argv in, options out,
// `CommandError` for anything a user can get wrong, so every flag combination is unit-testable.

import type { NavigatePlatform } from '../navigate/device';
import { PROGRAM_PREFIX } from '../programName';
import {
  DURATION_METAVAR,
  parseArgsOrThrow,
  resolveDuration,
  strayArgumentError,
} from '../utils/args';
import { CommandError } from '../utils/errors';
import { resolveDevServerTarget } from './devServer';
import { resolveDevicePlatform } from './devicePlatform';

/** Actions of the `runtime` group, in the order the help prints them. */
export const RUNTIME_ACTIONS = ['eval', 'errors'] as const;

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
  /**
   * The platform whose app to read, or undefined for whichever app is connected.
   *
   * @ref ./targetPlatform — friction run 6's F51. With an iOS simulator and an Android emulator on
   * one dev server, these commands took the first target the selector accepted, so which runtime
   * answered was an accident of ordering. Naming the platform is what makes the answer about the
   * app the caller means.
   */
  platform?: NavigatePlatform;
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
  /**
   * Exit 20 when the window caught anything (`--fail-on-error`).
   *
   * Opt-in, because the default job of this command is to collect: an empty window means "nothing
   * happened while I watched", which is not the same claim `dev:wait` makes when it exits 0.
   */
  failOnError: boolean;
}

export type RuntimeCommandOptions = RuntimeEvalOptions | RuntimeErrorsOptions;

const SHARED_ARGS = {
  '--dev-server-url': String,
  // Sugar for the URL above (llp/0005 §One preflight for the runtime family).
  '--port': String,
  // The three spellings of one fact, as everywhere else in this CLI (`./devicePlatform.ts`).
  '--ios': Boolean,
  '--android': Boolean,
  '--platform': String,
  '--json': Boolean,
};

// The durations are read as strings so an unusable value is reported as the user typed it,
// instead of as the `NaN` a numeric handler would produce.
const EVAL_ARGS = {
  ...SHARED_ARGS,
  '--timeout': String,
  '--no-await-promise': Boolean,
};

// `errors` listens over a window and reports follow-ups. `eval` does not take `--no-followups`:
// there it would be a flag that does nothing, and an unknown flag is a clearer answer than a
// silent no-op.
//
// `runtime:network` shared this schema until the v1 narrowing deferred it (llp/0016); what it took
// with it is in `src/deferred/runtime-network/resolveOptions.ts`.
const ERRORS_ARGS = {
  ...SHARED_ARGS,
  '--duration': String,
  '--no-followups': Boolean,
  '--fail-on-error': Boolean,
};

/** How long `runtime:errors` listens when the caller names no window. */
const DEFAULT_ERRORS_WINDOW_MS = 2000;

/**
 * Resolve the arguments of `@expo/agent-cli runtime:<action>`.
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
      `Missing action. Usage: ${PROGRAM_PREFIX} runtime:<${RUNTIME_ACTIONS.join('|')}>`
    );
  }
  if (!RUNTIME_ACTIONS.includes(action as RuntimeAction)) {
    throw new CommandError(
      'BAD_ARGS',
      `Unknown action: ${action}. Expected one of: ${RUNTIME_ACTIONS.join(', ')}`
    );
  }

  if (action === 'eval') {
    const args = parseArgsOrThrow(EVAL_ARGS, argv, 'runtime:eval');
    const positional = args._.slice(1);
    if (positional.length === 0) {
      throw new CommandError(
        'BAD_ARGS',
        `Missing expression. Usage: ${PROGRAM_PREFIX} runtime:eval "<expression>"`
      );
    }
    if (positional.length > 1) {
      throw new CommandError(
        'BAD_ARGS',
        `Expected one expression, but got ${positional.length} arguments (${positional.join(' ')}). Quote the expression so the shell passes it as one argument: ${PROGRAM_PREFIX} runtime:eval "${positional.join(' ')}"`
      );
    }

    return {
      action: 'eval',
      expression: positional[0]!,
      devServerUrl: resolveDevServerTarget(
        args['--dev-server-url'],
        args['--port'],
        'runtime:eval'
      ),
      platform: resolveDevicePlatform(args, 'runtime:eval', {
        bothHint: `pass one, or leave both out to read whichever app is connected.`,
      }),
      timeoutMs: resolveDuration(args['--timeout'], '--timeout', 5000, { allowZero: false }),
      awaitPromise: !args['--no-await-promise'],
      json: !!args['--json'],
    };
  }

  // The schema and the command name are written together on purpose: the suggested-command lint
  // checks a printed `--flag` against the schema of the command it is printed for, and can only do
  // that where the two are named in one call (`src/lint/commandFlags.ts`).
  const args = parseArgsOrThrow(ERRORS_ARGS, argv, 'runtime:errors');
  const positional = args._.slice(1);
  if (positional.length > 0) {
    throw strayArgumentError('runtime:errors', positional, {
      hint: `this command listens over a window and takes no target. Usage: ${PROGRAM_PREFIX} runtime:errors [--duration ${DURATION_METAVAR}]`,
    });
  }

  return {
    action: 'errors',
    devServerUrl: resolveDevServerTarget(
      args['--dev-server-url'],
      args['--port'],
      'runtime:errors'
    ),
    durationMs: resolveDuration(args['--duration'], '--duration', DEFAULT_ERRORS_WINDOW_MS, {
      allowZero: true,
    }),
    platform: resolveDevicePlatform(args, 'runtime:errors', {
      bothHint: `pass one, or leave both out to read whichever app is connected.`,
    }),
    json: !!args['--json'],
    followups: !args['--no-followups'],
    failOnError: !!args['--fail-on-error'],
  };
}
