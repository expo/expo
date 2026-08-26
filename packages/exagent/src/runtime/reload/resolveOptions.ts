// @ref llp/0005-runtime-loop-tools.rfc.md §Reloading the app
// @ref llp/0010-agent-conventions.rfc.md §Registry rules — rule (d)
// Argument resolution for `exagent runtime:reload`. Pure: argv in, options out, `CommandError` for
// anything a user can get wrong.

import type { NavigatePlatform } from '../../navigate/device';
import { resolveDevServerTarget } from '../devServer';
import { resolveDevicePlatform } from '../devicePlatform';
import { parseArgsOrThrow, resolveDuration, strayArgumentError } from '../../utils/args';
import { CommandError } from '../../utils/errors';

/**
 * How the app is made to reload.
 *
 * `dev-server` is the mechanism; `device` is the fallback. `auto` is the default and tries them in
 * that order, because the dev-server route needs no platform tools, no application id, and no
 * knowledge of which device the app is on — and takes under a second rather than about twelve.
 */
export type ReloadMethod = 'auto' | 'dev-server' | 'device';

export const RELOAD_METHODS: ReloadMethod[] = ['auto', 'dev-server', 'device'];

/** How long to wait for the app to come back, in milliseconds, when `--timeout` says nothing. */
export const DEFAULT_RELOAD_TIMEOUT_MS = 30_000;

export interface ReloadOptions {
  /** Route to land on after the reload, or null to let the app resume where it was. */
  route: string | null;
  /** How to reload. */
  method: ReloadMethod;
  /** The `--dev-server-url` the caller named, or null when the dev server is still to be found. */
  devServerUrl: string | null;
  /** Platform to reload on. Undefined means "whichever device is booted". */
  platform?: NavigatePlatform;
  /**
   * `--cloud`: the device method acts on this project's EAS Simulator session.
   *
   * Only the **device** method changes. The dev-server broadcast reaches a cloud session already —
   * it goes out over this dev server's own client command socket, and a cloud session has to reach
   * that dev server through a tunnel to be running the bundle at all (llp/0005 §A cloud simulator
   * requires a tunnel). So this flag is about the fallback: the force-stop and the relaunch.
   *
   * `required` and never `fallback`: a session bills by the minute, so the flag is the only way a
   * reload reaches one.
   */
  cloud: boolean;
  /** Application id to stop, for the device method. Undefined means "decide from the project". */
  appId?: string;
  /** URL scheme for the route's deep link, instead of the one in app.json. */
  scheme?: string;
  /** How long to wait for the app to reconnect, in milliseconds. */
  timeoutMs: number;
  /** Print the result as one JSON object instead of the human summary (`--json`). */
  json: boolean;
  /** Attach the state-aware next actions to the output, cleared by `--no-followups`. */
  followups: boolean;
  /** Check `--route` against the project's routes first, cleared by `--no-route-check`. */
  routeCheck: boolean;
  /**
   * Build the project's entry bundle before reloading, cleared by `--no-bundle-check`.
   *
   * The same gate and the same flag as `dev:wait`, for the same reason: a reload makes the app
   * fetch the served bundle again, so reloading onto a bundle that does not compile puts the app
   * back on the screen it was already on (llp/0010 §The reload gate).
   */
  bundleCheck: boolean;
}

const RELOAD_ARGS = {
  '--route': String,
  '--method': String,
  '--scheme': String,
  '--ios': Boolean,
  '--android': Boolean,
  // @ref llp/0005 §What the cloud backend can and cannot do. The device method is a force-stop and
  // a relaunch, and the controller has both — `close <app-id>` and `open <url>`.
  '--cloud': Boolean,
  '--dev-server-url': String,
  // Sugar for the URL above (llp/0005 §The dev server a caller names).
  '--port': String,
  '--platform': String,
  '--app-id': String,
  '--timeout': String,
  '--json': Boolean,
  '--no-followups': Boolean,
  '--no-route-check': Boolean,
  '--no-bundle-check': Boolean,
};

/**
 * Resolve the arguments of `exagent runtime:reload`.
 *
 * @throws {CommandError} `BAD_ARGS` for two platforms at once, an unknown method, an unusable
 * timeout or port, or a positional argument this command has no place for.
 */
export function resolveReloadOptions(argv: string[]): ReloadOptions {
  const args = parseArgsOrThrow(RELOAD_ARGS, argv, 'runtime:reload');

  // @ref llp/0010-agent-conventions.rfc.md §Registry rules — rule (d). The route is a flag here,
  // not a positional, because the command's subject is the app and not a route — so a bare word is
  // a caller who meant `--route`, and dropping it would reload without landing anywhere.
  if (args._.length > 0) {
    throw strayArgumentError('runtime:reload', args._, {
      hint: `to land on a route after the reload, pass it as a flag: npx exagent runtime:reload --route ${args._[0]}`,
    });
  }

  const method = (args['--method'] ?? 'auto') as ReloadMethod;
  if (!RELOAD_METHODS.includes(method)) {
    throw new CommandError(
      'BAD_ARGS',
      `--method is "${args['--method']}", which is not one of ${RELOAD_METHODS.join(', ')}. Leave it out to try the dev server first and the device second.`
    );
  }

  return {
    route: args['--route'] ? String(args['--route']) : null,
    method,
    devServerUrl: resolveDevServerTarget(args['--dev-server-url'], args['--port'], 'runtime:reload'),
    platform: resolveDevicePlatform(args, 'runtime:reload', {
      bothHint: 'run the command twice, once per device.',
    }),
    cloud: !!args['--cloud'],
    scheme: args['--scheme'] ? String(args['--scheme']) : undefined,
    appId: args['--app-id'] ? String(args['--app-id']) : undefined,
    timeoutMs: resolveDuration(args['--timeout'], '--timeout', DEFAULT_RELOAD_TIMEOUT_MS, {
      allowZero: false,
    }),
    json: !!args['--json'],
    followups: !args['--no-followups'],
    routeCheck: !args['--no-route-check'],
    bundleCheck: !args['--no-bundle-check'],
  };
}
