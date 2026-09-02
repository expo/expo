// @ref llp/0005-runtime-loop-tools.rfc.md §Stopping the app
// Argument resolution for `@expo/agent-cli runtime:stop`. Pure: argv in, options out, `CommandError` for
// anything a user can get wrong.

import type { NavigatePlatform } from '../navigate/device';
import { PROGRAM_PREFIX } from '../programName';
import { parseArgsOrThrow, strayArgumentError } from '../utils/args';
import { resolveDevServerTarget } from './devServer';
import { resolveDevicePlatform } from './devicePlatform';

export interface RuntimeStopOptions {
  /** Platform to stop the app on. Undefined means "whichever device is booted". */
  platform?: NavigatePlatform;
  /**
   * `--cloud`: stop the app on this project's EAS Simulator session rather than on a local device.
   *
   * Named rather than fallen back to. A session bills by the minute, so a run that a local device
   * would have served must never quietly become a cloud one — which is why this is `required` on
   * the ladder and not `fallback` (llp/0005 §Cloud simulator).
   */
  cloud: boolean;
  /** Application id to stop, which wins over everything this command could work out itself. */
  appId?: string;
  /** The `--dev-server-url` the caller named, or null when the dev server is still to be found. */
  devServerUrl: string | null;
  /** Print the result as one JSON object instead of the human summary (`--json`). */
  json: boolean;
  /** Attach the state-aware next actions to the output, cleared by `--no-followups`. */
  followups: boolean;
}

const RUNTIME_STOP_ARGS = {
  '--ios': Boolean,
  '--android': Boolean,
  // @ref llp/0005 §Cloud simulator. This used to be accepted only so it
  // could be refused by name: the first cut believed the controller had no verb that ends one app.
  // Reading `agent-device@0.20.10` found `close <appId>`, so the flag now does what an agent that
  // learned it from `navigate` expects it to do.
  '--cloud': Boolean,
  '--app-id': String,
  '--dev-server-url': String,
  // Sugar for the two flags above (llp/0005 §One preflight for the runtime family).
  '--port': String,
  '--platform': String,
  '--json': Boolean,
  '--no-followups': Boolean,
};

/**
 * Resolve the arguments of `@expo/agent-cli runtime:stop`.
 *
 * @throws {CommandError} `BAD_ARGS` for two platforms at once, an unusable dev server URL or port,
 * or a positional argument this command has no place for.
 */
export function resolveRuntimeStopOptions(argv: string[]): RuntimeStopOptions {
  const args = parseArgsOrThrow(RUNTIME_STOP_ARGS, argv, 'runtime:stop');

  // @ref llp/0010-agent-conventions.rfc.md §Registry rules. `runtime:stop <bundle-id>`
  // is the natural line to type, and dropping it would stop whatever this command worked out on
  // its own while reporting the id it stopped — which reads like it obeyed.
  if (args._.length > 0) {
    throw strayArgumentError('runtime:stop', args._, {
      hint: `to stop a particular app, pass its id as a flag: ${PROGRAM_PREFIX} runtime:stop --app-id ${args._[0]}`,
    });
  }

  return {
    platform: resolveDevicePlatform(args, 'runtime:stop', {
      bothHint: 'run the command twice, once per device.',
    }),
    cloud: !!args['--cloud'],
    appId: args['--app-id'] ? String(args['--app-id']) : undefined,
    devServerUrl: resolveDevServerTarget(args['--dev-server-url'], args['--port'], 'runtime:stop'),
    json: !!args['--json'],
    followups: !args['--no-followups'],
  };
}
