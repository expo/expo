// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract
// Argument resolution for `exagent dev:wait`. Pure: argv in, options out, `CommandError` for
// anything a user can get wrong, so every flag combination is unit-testable without a dev server.

import {
  BUNDLE_CHECK_PLATFORMS,
  DEFAULT_BUNDLE_CHECK_PLATFORM,
  type BundleCheckPlatform,
} from '../runtime/bundleCheck';
import { resolveDevServerTarget } from '../runtime/devServer';
import {
  DURATION_METAVAR,
  parseArgsOrThrow,
  resolveDuration,
  strayArgumentError,
} from '../utils/args';
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
  /**
   * Build the project's entry bundle once the dev server is ready, cleared by `--no-bundle-check`.
   *
   * On by default because it is the only part of this command that says anything about the
   * *project*: everything else it asks proves the bundler process is alive.
   */
  bundleCheck: boolean;
  /** Platform to build the entry bundle for (`--platform`). */
  platform: BundleCheckPlatform;
  /** Print the result as one JSON object instead of labelled lines. */
  json: boolean;
  /** Attach the state-aware next actions to the output, cleared by `--no-followups`. */
  followups: boolean;
}

const WAIT_ARGS = {
  '--dev-server-url': String,
  // Sugar for the URL above, because the port is what `exagent dev --port` was just given.
  '--port': String,
  // Read as a string so an unusable value is reported as the user typed it, instead of as the
  // `NaN` a numeric handler would produce.
  '--timeout': String,
  '--require-app': Boolean,
  '--no-bundle-check': Boolean,
  '--platform': String,
  '--json': Boolean,
  '--no-followups': Boolean,
};

/**
 * Resolve the arguments of `exagent dev:wait`.
 *
 * @throws {CommandError} `BAD_ARGS` for an unknown flag, an unusable value, or a stray argument.
 */
export function resolveDevWaitOptions(argv: string[]): DevWaitOptions {
  const args = parseArgsOrThrow(WAIT_ARGS, argv, 'dev:wait');
  if (args._.length > 0) {
    throw strayArgumentError('dev:wait', args._, {
      hint: `this command waits on the project's own dev server and takes no target. Usage: npx exagent dev:wait [--timeout ${DURATION_METAVAR}] [--require-app], or --dev-server-url <url> to wait on another one.`,
    });
  }

  return {
    devServerUrl: resolveDevServerTarget(args['--dev-server-url'], args['--port'], 'dev:wait'),
    // A wait of 0 is a mistake rather than a request to check once, so it is rejected here.
    timeoutMs: resolveDuration(args['--timeout'], '--timeout', DEFAULT_DEV_WAIT_TIMEOUT_MS, {
      allowZero: false,
    }),
    requireApp: !!args['--require-app'],
    bundleCheck: !args['--no-bundle-check'],
    platform: resolveBundlePlatform(args['--platform']),
    json: !!args['--json'],
    followups: !args['--no-followups'],
  };
}

/**
 * Read the `--platform` flag.
 *
 * @throws {CommandError} `BAD_ARGS` naming the platforms the entry bundle can be built for.
 */
function resolveBundlePlatform(value: unknown): BundleCheckPlatform {
  if (value == null) {
    return DEFAULT_BUNDLE_CHECK_PLATFORM;
  }
  const platform = String(value);
  if ((BUNDLE_CHECK_PLATFORMS as readonly string[]).includes(platform)) {
    return platform as BundleCheckPlatform;
  }
  throw new CommandError(
    'BAD_ARGS',
    `--platform ${platform} is not a platform the dev server builds a bundle for. Pass ${BUNDLE_CHECK_PLATFORMS.join(', ')} — the default is ${DEFAULT_BUNDLE_CHECK_PLATFORM}, because a syntax error is a syntax error on every platform.`
  );
}
