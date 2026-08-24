// @ref llp/0005-runtime-loop-tools.rfc.md §Stopping the app
// Argument resolution for `exagent runtime:stop`. Pure: argv in, options out, `CommandError` for
// anything a user can get wrong.

import type { NavigatePlatform } from '../navigate/device';
import { parseArgsOrThrow, strayArgumentError } from '../utils/args';
import { resolveDevServerTarget } from './devServer';
import { resolveDevicePlatform } from './devicePlatform';

export interface RuntimeStopOptions {
  /** Platform to stop the app on. Undefined means "whichever device is booted". */
  platform?: NavigatePlatform;
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
  '--app-id': String,
  '--dev-server-url': String,
  // Sugar for the two flags above (llp/0005 §The dev server a caller names).
  '--port': String,
  '--platform': String,
  '--json': Boolean,
  '--no-followups': Boolean,
};

/**
 * Resolve the arguments of `exagent runtime:stop`.
 *
 * @throws {CommandError} `BAD_ARGS` for two platforms at once, an unusable dev server URL or port,
 * or a positional argument this command has no place for.
 */
export function resolveRuntimeStopOptions(argv: string[]): RuntimeStopOptions {
  const args = parseArgsOrThrow(RUNTIME_STOP_ARGS, argv, 'runtime:stop');

  // @ref llp/0010-agent-conventions.rfc.md §Registry rules — rule (d). `runtime:stop <bundle-id>`
  // is the natural line to type, and dropping it would stop whatever this command worked out on
  // its own while reporting the id it stopped — which reads like it obeyed.
  if (args._.length > 0) {
    throw strayArgumentError('runtime:stop', args._, {
      hint: `to stop a particular app, pass its id as a flag: npx exagent runtime:stop --app-id ${args._[0]}`,
    });
  }

  return {
    platform: resolveDevicePlatform(args, 'runtime:stop', {
      bothHint: 'run the command twice, once per device.',
    }),
    appId: args['--app-id'] ? String(args['--app-id']) : undefined,
    devServerUrl: resolveDevServerTarget(args['--dev-server-url'], args['--port'], 'runtime:stop'),
    json: !!args['--json'],
    followups: !args['--no-followups'],
  };
}
