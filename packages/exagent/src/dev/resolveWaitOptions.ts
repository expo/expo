// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract
// Argument resolution for `exagent dev:wait`. Pure: argv in, options out, `CommandError` for
// anything a user can get wrong, so every flag combination is unit-testable without a dev server.

import { resolveDevServerUrlFlag } from '../runtime/devServer';
import { parseArgsOrThrow, resolveDuration } from '../utils/args';
import { CommandError } from '../utils/errors';

/**
 * Total budget of a wait, when the caller names none.
 *
 * Two minutes because that is what a cold first bundle of a real app costs — the case the command
 * exists for. A wait that gave up before the common slow path finished would just be a poll with
 * extra steps.
 */
export const DEFAULT_DEV_WAIT_TIMEOUT_MS = 120_000;

export interface DevWaitOptions {
  /**
   * The `--dev-server-url` the caller named, or null when they named none.
   *
   * Null is not "the default port": it means the dev server is still to be found, which is what
   * lets the command consult the project's dev-server lock and then fall back to a scan.
   */
  devServerUrl: string | null;
  /** Total budget for the whole wait, in milliseconds. */
  timeoutMs: number;
  /** Also wait for an app to attach to the dev server, not only for the bundler to finish. */
  requireApp: boolean;
  /** Print the result as one JSON object instead of labelled lines. */
  json: boolean;
  /** Attach the state-aware next actions to the output, cleared by `--no-followups`. */
  followups: boolean;
}

const WAIT_ARGS = {
  '--dev-server-url': String,
  // Read as a string so an unusable value is reported as the user typed it, instead of as the
  // `NaN` a numeric handler would produce.
  '--timeout': String,
  '--require-app': Boolean,
  '--json': Boolean,
  '--no-followups': Boolean,
};

/**
 * Resolve the arguments of `exagent dev:wait`.
 *
 * @throws {CommandError} `BAD_ARGS` for an unknown flag, an unusable value, or a stray argument.
 */
export function resolveDevWaitOptions(argv: string[]): DevWaitOptions {
  const args = parseArgsOrThrow(WAIT_ARGS, argv);
  if (args._.length > 0) {
    throw new CommandError(
      'BAD_ARGS',
      `Unexpected argument: ${args._[0]}. This command takes no arguments. Usage: npx exagent dev:wait [--timeout <ms>] [--require-app]`
    );
  }

  return {
    devServerUrl:
      args['--dev-server-url'] == null ? null : resolveDevServerUrlFlag(args['--dev-server-url']),
    // A wait of 0 is a mistake rather than a request to check once, so it is rejected here.
    timeoutMs: resolveDuration(args['--timeout'], '--timeout', DEFAULT_DEV_WAIT_TIMEOUT_MS, {
      allowZero: false,
    }),
    requireApp: !!args['--require-app'],
    json: !!args['--json'],
    followups: !args['--no-followups'],
  };
}
