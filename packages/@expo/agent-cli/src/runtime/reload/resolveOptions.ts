// @ref llp/0005-runtime-loop-tools.rfc.md §Reloading the app
// @ref llp/0010-agent-conventions.rfc.md §Registry rules
// Argument resolution for `@expo/agent-cli runtime:reload`. Pure: argv in, options out, `CommandError` for
// anything a user can get wrong.

import type { NavigatePlatform } from '../../navigate/device';
import { PROGRAM_PREFIX } from '../../programName';
import { parseArgsOrThrow, resolveDuration, strayArgumentError } from '../../utils/args';
import { CommandError } from '../../utils/errors';
import { resolveDevServerTarget } from '../devServer';
import { resolveDevicePlatform } from '../devicePlatform';

/**
 * How the app is made to reload.
 *
 * Three mechanisms, and `auto` tries them in the order of what they cost the running app:
 *
 * - **`dev-server`** — a broadcast on the dev server's own client command socket. Needs no platform
 *   tools, no application id and no knowledge of which device the app is on, and takes under a
 *   second rather than about twelve.
 * - **`runtime`** — `expo.reloadAppAsync()` over the debugger, at the same target `runtime:eval`
 *   reads. It is here because the two lists disagree: an app can be in `/json/list` and have no
 *   client on the command socket, which is what a cloud app over a tunnel was (llp/0005 §What proves a reload,
 *   one question). Also non-destructive, and the only mechanism that reaches such an app.
 * - **`device`** — a force-stop and a relaunch. It is the only one that can *start* an app, and the
 *   only one that stops a running one, so `auto` reaches it only when no app is connected at all.
 */
export type ReloadMethod = 'auto' | 'dev-server' | 'runtime' | 'device';

export const RELOAD_METHODS: ReloadMethod[] = ['auto', 'dev-server', 'runtime', 'device'];

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
   * `--cloud`: the reload acts on this project's EAS Simulator session.
   *
   * **This used to say the flag changed only the fallback**, on the grounds that "the dev-server
   * broadcast reaches a cloud session already — a cloud session has to reach that dev server
   * through a tunnel to be running the bundle at all". That premise was wrong, and it was wrong in
   * a way no stub could catch: the tunnel carries the **bundle**, over HTTP, and the app holds no
   * client on the dev server's command socket through it. The broadcast reached nobody, and the
   * fallback then force-stopped the app and could not start it again
   * [observed — live staging, 2026-08-26, S12; hit again, 2026-08-27].
   *
   * So the flag changes the **ladder**. On a cloud session the relaunch is the primary mechanism —
   * one controller verb, `open <app-id> <url> --relaunch` — and `auto` reaches it even with an app
   * on the debugger target list, because there the rule "never force-stop an app the dev server can
   * see" is protecting an alternative that does not exist
   * (llp/0005 §Cloud simulator, `./cloudReload.ts`).
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
   * back on the screen it was already on (llp/0010 §Other gates, in brief).
   */
  bundleCheck: boolean;
}

const RELOAD_ARGS = {
  '--route': String,
  '--method': String,
  '--scheme': String,
  '--ios': Boolean,
  '--android': Boolean,
  // @ref llp/0005 §Cloud simulator. One controller verb does both halves:
  // `open <app-id> <url> --relaunch` terminates the app process and launches it on the URL.
  '--cloud': Boolean,
  '--dev-server-url': String,
  // Sugar for the URL above (llp/0005 §One preflight for the runtime family).
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
 * Resolve the arguments of `@expo/agent-cli runtime:reload`.
 *
 * @throws {CommandError} `BAD_ARGS` for two platforms at once, an unknown method, an unusable
 * timeout or port, or a positional argument this command has no place for.
 */
export function resolveReloadOptions(argv: string[]): ReloadOptions {
  const args = parseArgsOrThrow(RELOAD_ARGS, argv, 'runtime:reload');

  // @ref llp/0010-agent-conventions.rfc.md §Registry rules. The route is a flag here,
  // not a positional, because the command's subject is the app and not a route — so a bare word is
  // a caller who meant `--route`, and dropping it would reload without landing anywhere.
  if (args._.length > 0) {
    throw strayArgumentError('runtime:reload', args._, {
      hint: `to land on a route after the reload, pass it as a flag: ${PROGRAM_PREFIX} runtime:reload --route ${args._[0]}`,
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
    devServerUrl: resolveDevServerTarget(
      args['--dev-server-url'],
      args['--port'],
      'runtime:reload'
    ),
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
