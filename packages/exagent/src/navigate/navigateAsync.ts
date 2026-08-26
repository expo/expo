// @ref llp/0005-runtime-loop-tools.rfc.md
// Open a route of the project in the app on a booted device, so a change can be verified on the
// screen it belongs to instead of by hand.
//
// The act itself is `openRouteAsync` (`./openRoute.ts`), which `exagent smoke` performs too. What
// is left here is this command's own half: its two output channels, its follow-ups, and the exit
// code it gives a device that refused the link.
import chalk from 'chalk';

import {
  buildNavigateFollowUps,
  followUpsEnabled,
  reportFollowUps,
  type FollowUp,
} from '../followups';
import * as Log from '../log';
import { EXIT_OUTCOME_TIMEOUT } from '../exitCodes';
import type { DevServerSource } from '../runtime/devServer';
import { openRouteAsync, type OpenRouteResult } from './openRoute';
import type { NavigateOptions } from './resolveOptions';
import type { RouteCheckJson } from './routeCheck';

/**
 * Machine shape of `exagent navigate --json`.
 *
 * @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — one JSON object on stdout,
 * with field names mirroring the labels of the human summary. Every key is always present, and
 * a fact the run does not have is `null`, so a parser can read the same shape every time.
 */
export interface NavigateResultJson {
  /** Route as it was passed on the command line. */
  route: string;
  /** URL that was opened on the device. */
  url: string;
  /** Dev server the URL was built from, whether named with `--dev-server-url` or discovered. */
  devServerUrl: string;
  /**
   * Which step produced {@link devServerUrl}: `flag`, `lock`, `log`, `default` or `scan`.
   *
   * Reported for the same reason `status` and `dev:wait` report it: `flag` and `lock` name a dev
   * server on purpose, and `default` or `scan` only found one that answered — which on a machine
   * running two projects may not be this one's.
   */
  devServerSource: DevServerSource;
  /** How the URL was derived, matching the line under `URL` in the human summary. */
  resolution: string;
  /** Why the target app was decided to be Expo Go or a development build. */
  target: string;
  platform: string;
  deviceId: string;
  /** Application id from `--app-id`, or null when it was not passed. */
  appId: string | null;
  /** Device command that was run, for reproducing the step by hand. */
  command: string;
  /** Exit code of that command: non-zero means the device refused the deep link. */
  exitCode: number | null;
  /**
   * Whether the route was checked against the project's routes, and what the check said.
   *
   * Always `ok: true` or `ok: null` here: a route the project has not got is a failure, so it
   * never reaches this object.
   */
  routeCheck: RouteCheckJson;
  /**
   * The port forwarded onto the device before the link, or null when none needed to be.
   *
   * Android only, and the fix for F50: `exp://127.0.0.1:<port>` means the *device's* loopback, so
   * without this an emulator loads the link against a port nothing listens on.
   */
  reversedPort: number | null;
  /**
   * Whether an app on this platform was seen to connect to the dev server afterwards.
   *
   * `null` when this run did not wait (`--no-wait-attach`). **This, not {@link exitCode}, is what
   * says the app is running the project**: `am start` exits 0 for an intent that lands on Expo Go's
   * error screen.
   */
  attached: boolean | null;
  /** How long the wait for that took, in milliseconds. */
  attachWaitedMs: number;
  /** Whether the app had to be stopped and the link opened again to get there. */
  attachRecovered: boolean;
  /**
   * State-aware next actions, empty when the device refused the link or they are suppressed.
   *
   * @see llp/0009-smart-followups.rfc.md §Design
   */
  followups: FollowUp[];
}

/**
 * Resolve a deep link for a route and open it on a device.
 *
 * The dev server is read for the app that is actually connected, because that answers which URL
 * shape the app understands. It is not required: a development build with a known scheme is
 * reachable without one.
 *
 * The dev server is *found* the same way every other runtime-facing command finds it — the
 * project's lock, then its start log, then a port scan — and not assumed to be on 8081. This
 * command drives a device, so a wrong dev server does not produce a wrong reading: it loads
 * another project's app onto the user's simulator and reports success.
 *
 * @returns the exit code: non-zero when the device refused the deep link.
 */
export async function navigateAsync(
  projectRoot: string,
  options: NavigateOptions
): Promise<number> {
  const { route, platform, scheme, appId, json, followups: wantFollowUps } = options;

  const opened = await openRouteAsync(projectRoot, {
    route,
    platform,
    scheme,
    appId,
    devServerUrl: options.devServerUrl,
    routeCheck: options.routeCheck,
    confirmAttachMs: options.attachTimeoutMs,
  });

  // @ref llp/0009-smart-followups.rfc.md §Examples per command — `navigate`. Only a link the
  // device accepted has a screen to capture, so a refusal carries no follow-up: its own what/why/
  // how below is the next step.
  const followups =
    opened.exitCode === 0 && opened.attach.confirmed !== false && followUpsEnabled(wantFollowUps)
      ? buildNavigateFollowUps({
          platform: opened.platform,
          deviceId: opened.deviceId,
          adbPath: opened.adbPath ?? undefined,
        })
      : [];

  if (json) {
    const report: NavigateResultJson = {
      route: opened.route,
      url: opened.url,
      devServerUrl: opened.devServerUrl,
      devServerSource: opened.devServerSource,
      resolution: opened.resolution,
      target: opened.target,
      platform: opened.platform,
      deviceId: opened.deviceId,
      appId: opened.appId,
      command: opened.command,
      exitCode: opened.exitCode,
      routeCheck: opened.routeCheck,
      reversedPort: opened.reverse?.ok ? opened.reverse.port : null,
      attached: opened.attach.confirmed,
      attachWaitedMs: opened.attach.waitedMs,
      attachRecovered: opened.attach.recovered,
      followups,
    };
    // The object is the whole of stdout, so the output can be piped into a parser. The failure
    // below still explains itself, on stderr.
    Log.log(JSON.stringify(report, null, 2));
  } else {
    const deviceLabel = opened.deviceName
      ? `${opened.deviceName} (${opened.deviceId})`
      : opened.deviceId;
    Log.log(
      [
        chalk`{bold URL} ${opened.url}`,
        chalk`{dim  ${opened.resolution}}`,
        chalk`{dim  target: ${opened.target}}`,
        chalk`{bold Dev server} ${opened.devServerUrl}{dim  · via ${opened.devServerSource}}`,
        chalk`{bold Device} ${opened.platform} ${deviceLabel}`,
        // Always a line when a reverse was needed, whether or not it worked: the absence of one is
        // not something a reader can notice, and this is the step F50 was missing entirely.
        ...(opened.reverse?.ran
          ? [
              chalk`{bold Port} ${
                opened.reverse.ok
                  ? chalk.green(`reversed tcp:${opened.reverse.port}`)
                  : chalk.red(`not reversed · ${opened.reverse.reason}`)
              }{dim  · ${opened.reverse.command}}`,
            ]
          : []),
        chalk`{dim  ${opened.command}}`,
        chalk`{bold App} ${
          opened.attach.confirmed === true
            ? chalk.green('attached') +
              chalk.dim(
                ` · ${opened.attach.targets} ${opened.platform} debugger ${
                  opened.attach.targets === 1 ? 'target' : 'targets'
                } after ${opened.attach.waitedMs}ms${
                  opened.attach.recovered ? ', after a restart' : ''
                }`
              )
            : opened.attach.confirmed === false
              ? chalk.red('not attached') + chalk.dim(` · ${opened.attach.reason}`)
              : chalk.dim(`not checked · ${opened.attach.reason}`)
        }`,
        chalk`{bold Route} ${
          opened.routeCheck.ok
            ? `${opened.routeCheck.matched}${chalk.dim(
                ` · 1 of ${opened.routeCheck.routeCount} routes in this project${
                  opened.routeCheck.matched === route ? '' : ', matched as a pattern'
                }`
              )}`
            : chalk.dim(`not checked · ${opened.routeCheck.reason}`)
        }`,
      ].join('\n')
    );
  }

  if (opened.exitCode !== 0) {
    Log.error(
      [
        chalk.red(
          `The device did not open the deep link (${opened.command} exited with ${opened.exitCode ?? 'a signal'}).`
        ),
        `Why: ${opened.stderr.trim() || opened.stdout.trim() || 'the device tool reported no output.'}`,
        opened.isExpoGo
          ? `How: make sure Expo Go is installed on this device and the dev server at ${opened.devServerUrl} is running, then run this command again.`
          : `How: make sure the app is installed on this device and its scheme matches ${opened.url.split('://')[0]}://. Rebuild the app after changing the "scheme" field, then run this command again.`,
      ].join('\n')
    );
    return 1;
  }

  // What the device tool printed is a note for a human, so it is left out of the JSON object
  // rather than added to it: `command` says how to read it again.
  if (!json && opened.stdout.trim()) {
    Log.log(chalk.dim(opened.stdout.trim()));
  }

  // @ref llp/0010-agent-conventions.rfc.md §Exit codes — `22`, "nothing was shown to be wrong and
  // nothing was proved right". The link was delivered and no app came back, which is exactly that:
  // the device may still be loading a cold bundle, and it may be sitting on an error screen. What
  // it is not is a success, which is what exit 0 said here [friction run 6, F50].
  if (opened.attach.confirmed === false) {
    Log.error(attachNotConfirmed(opened, options));
    reportFollowUps('navigate', followups, { json });
    return EXIT_OUTCOME_TIMEOUT;
  }

  // Last, so the `Suggested next:` section is the last thing in the terminal, after what the device said.
  reportFollowUps('navigate', followups, { json });
  return 0;
}

/** The what / why / how for a link that was delivered and produced no connected app. */
function attachNotConfirmed(opened: OpenRouteResult, options: NavigateOptions): string {
  const reverseClause =
    opened.reverse?.ran && opened.reverse.ok === false
      ? ` The port forward this link needs did not go in either (${opened.reverse.reason}), so the app had no route back to this machine at all.`
      : opened.reverse?.ok
        ? ` The dev server's port was forwarded onto the device first, so the app could reach it.`
        : '';

  return [
    chalk.red(
      `The link was opened on the device, and no ${opened.platform} app connected to ${opened.devServerUrl} within ${opened.attach.waitedMs}ms.`
    ),
    `Why: "${opened.command}" exited 0, which says the device accepted the intent and nothing more — an app that fails to load its bundle sits on an error screen having accepted one.${reverseClause}${
      opened.attach.recovered
        ? ' The app was stopped and the link opened a second time, and that did not attach either.'
        : ''
    }`,
    `How: look at what the dev server was asked for with "npx exagent dev:logs", and at the screen with "npx exagent smoke --platform ${opened.platform} --no-route-check". A first bundle on a cold device can take longer than this wait — raise it with --attach-timeout 90s. Pass --no-wait-attach to report only what the device tool said, which is what this command used to do.`,
  ].join('\n');
}
