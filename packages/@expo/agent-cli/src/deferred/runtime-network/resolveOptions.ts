// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0005
//
// @ref llp/0005-runtime-loop-tools.rfc.md
// Argument resolution for `@expo/agent-cli runtime:network`, lifted out of `src/runtime/resolveOptions.ts`
// when the command left the v1 surface.
//
// The action shared `src/runtime/resolveOptions.ts` with `eval` and `errors` rather than having a
// module of its own, so this file is what the shared one carried for it: the options type, the flag
// schema, the default window, and the branch that built the result.

import type { NavigatePlatform } from '../../navigate/device';
import { PROGRAM_PREFIX } from '../../programName';
import { resolveDevServerTarget } from '../../runtime/devServer';
import { resolveDevicePlatform } from '../../runtime/devicePlatform';
import {
  DURATION_METAVAR,
  parseArgsOrThrow,
  resolveDuration,
  strayArgumentError,
} from '../../utils/args';

export interface RuntimeNetworkOptions {
  action: 'network';
  /** The `--dev-server-url` the caller named, or null when they named none. */
  devServerUrl: string | null;
  /** The platform whose app to read, or undefined for whichever app is connected. */
  platform?: NavigatePlatform;
  /** How long to listen for network requests, in milliseconds. */
  durationMs: number;
  json: boolean;
  /** Attach the state-aware next actions to the output, cleared by `--no-followups`. */
  followups: boolean;
}

/**
 * The flags `runtime:network` took.
 *
 * `errors` and `network` both listened over a window and both reported follow-ups, so in the live
 * module these were one shared `WINDOW_ARGS` that `ERRORS_ARGS` extended with `--fail-on-error`.
 * Only `errors` gated on what it collected: a failed request is a report `network` makes about the
 * app's behaviour, not a verdict, and there was no equivalent question to answer here.
 */
const NETWORK_ARGS = {
  '--dev-server-url': String,
  // Sugar for the URL above (llp/0005 §One preflight for the runtime family).
  '--port': String,
  // The three spellings of one fact, as everywhere else in this CLI (`src/runtime/devicePlatform`).
  '--ios': Boolean,
  '--android': Boolean,
  '--platform': String,
  '--json': Boolean,
  '--duration': String,
  '--no-followups': Boolean,
};

/**
 * The window this action listened over when the caller named none.
 *
 * Longer than the 2s of `errors`: network activity is sparser — a screen often makes one request
 * after a tap — so a shorter window's usual answer would be an empty report.
 */
const DEFAULT_NETWORK_WINDOW_MS = 5000;

/** Resolve the arguments of `@expo/agent-cli runtime:network`, with the action already stripped. */
export function resolveRuntimeNetworkCommand(argv: string[]): RuntimeNetworkOptions {
  const args = parseArgsOrThrow(NETWORK_ARGS, argv, 'runtime:network');
  const positional = args._.slice(1);
  if (positional.length > 0) {
    throw strayArgumentError('runtime:network', positional, {
      hint: `this command listens over a window and takes no target. Usage: ${PROGRAM_PREFIX} runtime:network [--duration ${DURATION_METAVAR}]`,
    });
  }

  return {
    action: 'network',
    devServerUrl: resolveDevServerTarget(
      args['--dev-server-url'],
      args['--port'],
      'runtime:network'
    ),
    durationMs: resolveDuration(args['--duration'], '--duration', DEFAULT_NETWORK_WINDOW_MS, {
      allowZero: true,
    }),
    platform: resolveDevicePlatform(args, 'runtime:network', {
      bothHint: `pass one, or leave both out to read whichever app is connected.`,
    }),
    json: !!args['--json'],
    followups: !args['--no-followups'],
  };
}
