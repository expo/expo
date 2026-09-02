// @ref llp/0005-runtime-loop-tools.rfc.md
// Argument resolution for `@expo/agent-cli navigate`. Pure: argv in, options out, `CommandError` for
// anything a user can get wrong.

import { PROGRAM_PREFIX } from '../programName';
import { resolveDevServerUrlFlag } from '../runtime/devServer';
import { parseArgsOrThrow, resolveDuration } from '../utils/args';
import { CommandError } from '../utils/errors';
import type { CloudPreference, NavigatePlatform } from './device';

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
   * @see llp/0005-runtime-loop-tools.rfc.md §navigate
   */
  printUrl: boolean;
  /**
   * Which device backends this run may use, decided by `--cloud`.
   *
   * `required` when the flag was passed, `fallback` otherwise — so a machine with a local device
   * behaves exactly as it did, and one with none reaches for an EAS Simulator session instead of
   * only being told it has no device. Never `off` here: `navigate` is the command the cloud
   * backend exists for.
   *
   * @see llp/0005-runtime-loop-tools.rfc.md §Cloud simulator
   */
  cloud: CloudPreference;
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
  /**
   * How long to wait for the app to attach to the dev server afterwards, in milliseconds.
   *
   * Zero when `--no-wait-attach` was passed, which reduces this command to what it used to be:
   * deliver the intent and report the device tool's exit code. That was exit 0 for an app sitting
   * on Expo Go's error screen [friction run 6, F50], which is why waiting is the default.
   */
  attachTimeoutMs: number;
}

/**
 * How long the app gets to register a debugger target after the link, when nothing says otherwise.
 *
 * Generous, because it contains a cold bundle download on a device: live on an Android emulator the
 * first attach after a force-stop took about 20 s [observed — 2026-08-25, notesapp on SDK 57].
 */
export const DEFAULT_ATTACH_TIMEOUT_MS = 45_000;

const NAVIGATE_ARGS = {
  '--scheme': String,
  '--ios': Boolean,
  '--android': Boolean,
  // A third backend rather than a third platform, which is why it is not part of the pair above:
  // a session is iOS or Android too, and `--cloud --ios` is a meaningful thing to type.
  '--cloud': Boolean,
  '--dev-server-url': String,
  '--app-id': String,
  '--print-url': Boolean,
  '--attach-timeout': String,
  '--no-wait-attach': Boolean,
  '--json': Boolean,
  '--no-followups': Boolean,
  '--no-route-check': Boolean,
};

/**
 * Resolve the arguments of `@expo/agent-cli navigate <route>`.
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
      `Missing route. Usage: ${PROGRAM_PREFIX} navigate <route>, for example: ${PROGRAM_PREFIX} navigate /profile/42`
    );
  }
  if (positional.length > 1) {
    throw new CommandError(
      'BAD_ARGS',
      `Expected one route, but got ${positional.length} (${positional.join(' ')}). Quote the route so the shell passes it as one argument.`
    );
  }

  // The one flag pair that cannot be read as a refinement of the other: `--print-url` is the mode
  // that asks for **no** device, and `--cloud` names one. A run that took both would have to
  // either open the link (ignoring `--print-url`) or not (ignoring `--cloud`).
  if (args['--cloud'] && args['--print-url']) {
    throw new CommandError(
      'BAD_ARGS',
      [
        `--cloud and --print-url ask for opposite things, so this run has no rule for what to do.`,
        `Why: --cloud says to open the link on an EAS Simulator session, and --print-url says to open nothing and print the URL instead.`,
        `How: pass one. Use --cloud to drive the session, or --print-url to get the URL and hand it to whatever opens it.`,
      ].join('\n')
    );
  }

  if (args['--attach-timeout'] != null && args['--no-wait-attach']) {
    throw new CommandError(
      'BAD_ARGS',
      [
        `--attach-timeout and --no-wait-attach ask for opposite things, so this run has no rule for what to do.`,
        `Why: --attach-timeout says how long to wait for the app to connect, and --no-wait-attach says not to wait at all.`,
        `How: pass one. Use --attach-timeout ${args['--attach-timeout']} to change the budget, or --no-wait-attach to report only what the device tool said.`,
      ].join('\n')
    );
  }

  return {
    route: positional[0]!,
    attachTimeoutMs: args['--no-wait-attach']
      ? 0
      : resolveDuration(args['--attach-timeout'], '--attach-timeout', DEFAULT_ATTACH_TIMEOUT_MS, {
          allowZero: false,
        }),
    devServerUrl:
      args['--dev-server-url'] == null ? null : resolveDevServerUrlFlag(args['--dev-server-url']),
    platform: args['--ios'] ? 'ios' : args['--android'] ? 'android' : undefined,
    scheme: args['--scheme'] ? String(args['--scheme']) : undefined,
    appId: args['--app-id'] ? String(args['--app-id']) : undefined,
    printUrl: !!args['--print-url'],
    cloud: args['--cloud'] ? 'required' : 'fallback',
    json: !!args['--json'],
    followups: !args['--no-followups'],
    routeCheck: !args['--no-route-check'],
  };
}
