// @ref llp/0005-runtime-loop-tools.rfc.md §One preflight for the runtime family
// Which device a runtime command acts on, from the three spellings that name one.
//
// `--ios` and `--android` are this CLI's own spelling and `expo start`'s. `--platform ios` is the
// spelling `dev:wait` takes, and `runtime:stop --json` reports `"platform": "ios"`
// back — so a caller reading one report and writing the next command typed `--platform ios` and was
// answered `unknown or unexpected option` [observed — friction run 4, 2026-08-23]. Accepting it is
// one line; making the caller translate between two spellings of one fact is not.

import type { NavigatePlatform } from '../navigate/device';
import { PROGRAM_NAME } from '../programName';
import { CommandError } from '../utils/errors';

/** The platforms a runtime command can act on, i.e. the ones with a device tool behind them. */
export const RUNTIME_PLATFORMS: NavigatePlatform[] = ['ios', 'android'];

/**
 * The parsed flags this reads: `--ios`, `--android` and `--platform`.
 *
 * An index signature rather than the three keys, because the argument is an `arg.Result`, whose own
 * type is an index signature — a stricter type here would only be assignable through a cast, which
 * checks nothing and reads as if it did.
 */
export interface DevicePlatformFlags {
  readonly [flag: string]: unknown;
}

/**
 * The platform a runtime command was told to act on, or undefined for "whichever device is booted".
 *
 * @param command the command as a caller types it, for the errors.
 * @param bothHint one sentence for the caller who named both platforms, naming what to do instead.
 * @throws {CommandError} `BAD_ARGS` when two platforms are named, or `--platform` names something
 * that is not one.
 */
export function resolveDevicePlatform(
  args: DevicePlatformFlags,
  command: string,
  { bothHint }: { bothHint: string }
): NavigatePlatform | undefined {
  const named: NavigatePlatform[] = [];
  if (args['--ios']) {
    named.push('ios');
  }
  if (args['--android']) {
    named.push('android');
  }
  if (args['--platform'] != null) {
    const platform = String(args['--platform']);
    if (!RUNTIME_PLATFORMS.includes(platform as NavigatePlatform)) {
      throw new CommandError(
        'BAD_ARGS',
        [
          `--platform is "${platform}", which is not a platform "${PROGRAM_NAME} ${command}" can act on.`,
          `Why: this command drives the app through a device tool — "xcrun simctl" or "adb" — and only ${RUNTIME_PLATFORMS.join(' and ')} have one.`,
          `How: pass ${RUNTIME_PLATFORMS.map((name) => `--platform ${name}`).join(' or ')}, or leave it out to act on whichever device is booted.`,
        ].join('\n')
      );
    }
    if (!named.includes(platform as NavigatePlatform)) {
      named.push(platform as NavigatePlatform);
    }
  }

  if (named.length > 1) {
    throw new CommandError(
      'BAD_ARGS',
      [
        `${named.map((name) => `--${name}`).join(' and ')} name two different devices, so only one of them can be used.`,
        `Why: this command acts on one app on one device, and there is no order between the two that would not silently drop one of them.`,
        `How: ${bothHint}`,
      ].join('\n')
    );
  }
  return named[0];
}
