// @ref llp/0005-runtime-loop-tools.rfc.md
// Argument resolution for `exagent navigate`. Pure: argv in, options out, `CommandError` for
// anything a user can get wrong.

import { resolveDevServerUrlFlag } from '../runtime/devServer';
import { parseArgsOrThrow } from '../utils/args';
import { CommandError } from '../utils/errors';
import type { NavigatePlatform } from './device';

export interface NavigateOptions {
  /** Route path (`/profile/42`) or a full URL (`myapp://profile/42`). */
  route: string;
  /**
   * The `--dev-server-url` the caller named, or null when they named none.
   *
   * Null is not "the default port": it means the dev server is still to be found, which is what
   * lets the command consult the project's dev-server lock and then fall back to a scan
   * (`discoverDevServerAsync`), exactly as the `runtime:*` actions do. This command used to default
   * to 8081 here, which sent the device into whichever project happened to hold that port.
   */
  devServerUrl: string | null;
  /** Platform to open the link on. Undefined means "whichever device is booted". */
  platform?: NavigatePlatform;
  /** URL scheme, which wins over the scheme read from the project config. */
  scheme?: string;
  /** Application id of the target app, for the Android intent and the Expo Go check. */
  appId?: string;
  /**
   * Resolve the URL and print it, opening nothing and asking for no device (`--print-url`).
   *
   * The mode exists because the device this CLI can drive and the device the app runs on are not
   * always the same one. A cloud simulator, a phone, and a teammate's machine all need the same
   * thing — the URL — and none of them can be reached with `simctl` or `adb`. Everything else this
   * command does still happens: the route is checked against the project's routes, the dev server
   * is found, the Expo Go / development build decision is made, and a tunnelled dev server's host
   * is preferred over the LAN one. Only the last step is left out.
   *
   * @see llp/0005-runtime-loop-tools.rfc.md §Resolving a URL without a device
   */
  printUrl: boolean;
  /** Print the result as one JSON object instead of the human summary (`--json`). */
  json: boolean;
  /** Attach the state-aware next actions to the output, cleared by `--no-followups`. */
  followups: boolean;
  /**
   * Check the route against the project's route table before opening it, cleared by
   * `--no-route-check`.
   *
   * The escape hatch exists because the table is read from the files with the router's
   * conventions rather than from the router itself, so a project doing something the conventions
   * do not describe must still be able to open a link.
   */
  routeCheck: boolean;
}

const NAVIGATE_ARGS = {
  '--scheme': String,
  '--ios': Boolean,
  '--android': Boolean,
  '--dev-server-url': String,
  '--app-id': String,
  '--print-url': Boolean,
  '--json': Boolean,
  '--no-followups': Boolean,
  '--no-route-check': Boolean,
};

/**
 * Resolve the arguments of `exagent navigate <route>`.
 *
 * @throws {CommandError} `BAD_ARGS` for a missing route, both platform flags at once, an unknown
 * flag, or an unusable value.
 */
export function resolveNavigateOptions(argv: string[]): NavigateOptions {
  const args = parseArgsOrThrow(NAVIGATE_ARGS, argv, 'navigate');

  if (args['--ios'] && args['--android']) {
    throw new CommandError(
      'BAD_ARGS',
      `--ios and --android name two different devices, so only one of them can be used. Run the command twice to navigate on both.`
    );
  }

  const positional = args._;
  if (positional.length === 0) {
    throw new CommandError(
      'BAD_ARGS',
      `Missing route. Usage: npx exagent navigate <route>, for example: npx exagent navigate /profile/42`
    );
  }
  if (positional.length > 1) {
    throw new CommandError(
      'BAD_ARGS',
      `Expected one route, but got ${positional.length} (${positional.join(' ')}). Quote the route so the shell passes it as one argument.`
    );
  }

  return {
    route: positional[0]!,
    devServerUrl:
      args['--dev-server-url'] == null ? null : resolveDevServerUrlFlag(args['--dev-server-url']),
    platform: args['--ios'] ? 'ios' : args['--android'] ? 'android' : undefined,
    scheme: args['--scheme'] ? String(args['--scheme']) : undefined,
    appId: args['--app-id'] ? String(args['--app-id']) : undefined,
    printUrl: !!args['--print-url'],
    json: !!args['--json'],
    followups: !args['--no-followups'],
    routeCheck: !args['--no-route-check'],
  };
}
