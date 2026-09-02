// @ref llp/0005-runtime-loop-tools.rfc.md §Stopping the app
// Stop the app on the device it is running on.
//
// The counterpart of `navigate`, which starts one. Between them an agent can put an app into a
// known state without composing a `simctl` or `adb` line, and without knowing which of the two
// tools this machine uses or what the app is called on it — which is the part that is actually
// hard, because the answer differs between Expo Go and a development build and changes the moment
// the project grows a native directory.

import chalk from 'chalk';

import { event as cliEvent } from '../events';
import { EXIT_OUTCOME_FAILED } from '../exitCodes';
import { followUpsEnabled, reportFollowUps, type FollowUp } from '../followups';
import * as Log from '../log';
import { resolveDeviceAsync } from '../navigate/device';
import { PROGRAM_PREFIX } from '../programName';
import { readConfiguredAppId, resolveAppId } from './appId';
import { stopAppOnDeviceAsync } from './appProcess';
import { debugEvent, event } from './events';
import { preflightRuntimeAsync } from './preflight';
import type { RuntimeStopOptions } from './resolveStopOptions';

/**
 * Machine shape of `@expo/agent-cli runtime:stop --json`.
 *
 * @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — one JSON object on stdout,
 * every key always present, and a fact the run does not have is null.
 */
export interface RuntimeStopResultJson {
  /** The app is not running on the device now. True whether it had to be stopped or already was. */
  stopped: boolean;
  /**
   * The app was running when the command started, so stopping it did something.
   *
   * Kept apart from {@link stopped} because they answer different questions: `stopped` is the
   * state the caller wanted, `wasRunning` is whether this command is what produced it. An agent
   * that stops an app twice must not read the second run as a failure.
   *
   * **Null on a cloud simulator**, where it cannot be established: `agent-device close` answers
   * about the controller's session whatever application id it is given, so its success says the
   * app in front was closed and says nothing about *this* id [observed — live, 2026-08-26]. A
   * `true` there would be this command inventing the one fact it exists to report, which is worse
   * than a null a caller can branch on (llp/0005 §Cloud simulator).
   */
  wasRunning: boolean | null;
  platform: string;
  /**
   * Which device layer acted: `local-ios`, `local-android`, or `cloud`.
   *
   * Reported for the reason `navigate` reports it — `ios` no longer says *where* the device is, and
   * the difference decides which command a reader can run by hand (llp/0005 §Cloud simulator).
   */
  deviceBackend: string;
  deviceId: string;
  /** Application id that was stopped. */
  bundleId: string;
  /** Which evidence named it: `flag`, `dev-server`, `app-config`, or `expo-go-default`. */
  bundleIdSource: string;
  /** One clause naming that evidence, for a report a wrong stop can be diagnosed from. */
  bundleIdReason: string;
  /** The device command that ran, for reproducing the step by hand. */
  command: string;
  /** What the device tool said when it did not stop the app. Null when it did. */
  reason: string | null;
  /**
   * Application ids of the apps connected to the dev server **on the platform this stopped**.
   *
   * Reported whether or not they were used to choose {@link bundleId}: they are what makes a
   * `--app-id` that stopped nothing diagnosable, and the command had them all along.
   *
   * Scoped rather than every id the dev server listed, and that is F101. This command acts on one
   * device, and Expo Go's two application ids differ by one capital letter — so the unscoped list
   * handed an `--android` run the iOS spelling, which `am force-stop` accepted, exited 0 on, and did
   * nothing with. An id from another device is not a candidate for this stop and is not evidence
   * about it.
   */
  connectedAppIds: string[];
  /**
   * `--app-id` named an app that was not running, while another one is connected.
   *
   * @see llp/0005 §Stopping the app — friction run 4, F42.
   */
  appIdMismatch: boolean;
  followups: FollowUp[];
}

/**
 * Stop the app on a device.
 *
 * @returns the exit code: `0` the app is not running, `20` the app named by `--app-id` was never
 * running and another one is, `1` the device refused.
 */
export async function runtimeStopAsync(
  projectRoot: string,
  options: RuntimeStopOptions
): Promise<number> {
  // @ref llp/0005-runtime-loop-tools.rfc.md §Cloud simulator.
  // `required` and never `fallback`: a session bills by the minute, so `--cloud` is the only way a
  // stop reaches one, and a machine with no local device is told it has none rather than quietly
  // handed a paid device it did not ask for.
  const device = await resolveDeviceAsync(options.platform, {
    cloud: options.cloud ? 'required' : 'off',
    projectRoot,
  });

  // @ref ./preflight — the family's one resolution step, asked here for what it can give rather
  // than for a precondition. `need: 'optional'` is the honest answer for this command: it acts on a
  // **device**, the dev server is its strongest evidence for *which* app is running, and an app can
  // be running with no dev server behind it at all. Requiring a debugger target here would refuse
  // the run that llp/0010 §Other gates, in brief calls a success — stopping an app that has
  // already stopped — so the connection is read and never insisted on.
  //
  // The platform is passed even though nothing here refuses on it (F101). `resolveDeviceAsync` has
  // just settled which device this stop acts on, and the preflight's `appTargets` is the scoped list
  // every other command in the family reads — without it, the id below came off whichever target
  // the dev server happened to list first, on either platform.
  const devServer = await preflightRuntimeAsync(
    {
      need: 'optional',
      devServerUrl: options.devServerUrl ?? null,
      cloud: options.cloud,
      platform: device.platform,
    },
    { projectRoot }
  );
  const connectedAppIds = devServer.appTargets.map((target) => target.appId).filter(Boolean);
  const resolved = resolveAppId({
    platform: device.platform,
    appIdOverride: options.appId,
    targetAppIds: connectedAppIds,
    configured: readConfiguredAppId(projectRoot, device.platform),
  });
  debugEvent('stop_app_resolved', { appId: resolved.appId, source: resolved.source });

  const result = await stopAppOnDeviceAsync({
    platform: device.platform,
    deviceId: device.deviceId,
    appId: resolved.appId,
    // The same `adb` the device probe found, so this never falls back to a bare name (F49).
    adb: device.adb,
    backend: device.backend,
    projectRoot,
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §Stopping the app — friction run 4, F42.
  // Three facts, and only their conjunction is worth failing on: the caller named the id (so this
  // is not a guess of ours to defend), the device found nothing under it, and the dev server is
  // reporting some other app that is running right now. Each on its own is ordinary — a device
  // runs more than one app, and stopping an app twice must stay a success.
  // `result.verified` leads: the mismatch is "the device found no process under this id", and a
  // backend whose answer is not about the id has not found that. On a cloud session the check is
  // simply never reached, which is the honest answer rather than a quiet false.
  const appIdMismatch =
    result.verified &&
    resolved.source === 'flag' &&
    result.ok &&
    result.wasAlreadyStopped &&
    connectedAppIds.length > 0 &&
    !connectedAppIds.includes(resolved.appId);

  const report: RuntimeStopResultJson = {
    stopped: result.ok,
    wasRunning: result.verified ? result.ok && !result.wasAlreadyStopped : null,
    platform: device.platform,
    deviceBackend: device.backend,
    deviceId: device.deviceId,
    bundleId: resolved.appId,
    bundleIdSource: resolved.source,
    bundleIdReason: resolved.reason,
    command: result.command,
    reason: result.ok ? null : result.reason,
    connectedAppIds,
    appIdMismatch,
    followups: [],
  };
  report.followups =
    result.ok && followUpsEnabled(options.followups) ? buildStopFollowUps(report) : [];

  event('stop_app_done', {
    stopped: report.stopped,
    wasRunning: report.wasRunning ?? null,
    appIdMismatch: report.appIdMismatch,
  });
  cliEvent('runtime_stop', {
    stopped: report.stopped,
    wasRunning: report.wasRunning,
    platform: report.platform,
    deviceBackend: report.deviceBackend,
    deviceId: report.deviceId,
    bundleId: report.bundleId,
    appIdMismatch: report.appIdMismatch,
  });

  if (options.json) {
    Log.log(JSON.stringify(report, null, 2));
  } else {
    printHumanReport(report);
  }

  if (!result.ok) {
    Log.error(
      [
        chalk.red(`The device did not stop ${resolved.appId} (${result.command}).`),
        `Why: ${result.reason}.`,
        // `simctl` and `adb` are commands about *this machine*, and the device may not be on it.
        // A cloud session is checked with the CLI that owns it (llp/0005 §Cloud simulator).
        `How: check that ${resolved.appId} is the app you meant — ${resolved.reason} — and pass --app-id to name another. ${
          device.backend === 'cloud'
            ? 'Check that the session is still running with "npx eas simulator:list --status in-progress".'
            : device.platform === 'ios'
              ? 'Check that the simulator is booted with "xcrun simctl list devices booted".'
              : 'Check that the device is attached with "adb devices".'
        }`,
      ].join('\n')
    );
    return 1;
  }

  if (appIdMismatch) {
    const connected = connectedAppIds.join(', ');
    Log.error(
      [
        chalk.red(`Nothing was stopped: ${resolved.appId} was not running, and ${connected} is.`),
        `Why: --app-id names the app to stop and outranks every other piece of evidence, so it was used as given — and ${result.command} found no process under it. Meanwhile the dev server at ${devServer.devServerUrl} reports ${connectedAppIds.length === 1 ? 'a debugger target' : `${connectedAppIds.length} debugger targets`} for ${connected}, which ${connectedAppIds.length === 1 ? 'is' : 'are'} still running. This is exit 20 rather than 0 because the app you can see on the device is untouched: the requested state holds only for an id nothing was using.`,
        `How: run "${PROGRAM_PREFIX} runtime:stop --app-id ${connectedAppIds[0]}" to stop what is actually running, or leave --app-id out entirely — without it this command reads the id off the dev server. If you did mean ${resolved.appId}, it is already not running and there is nothing to do.`,
      ].join('\n')
    );
    reportFollowUps('runtime:stop', report.followups, { json: options.json });
    return EXIT_OUTCOME_FAILED;
  }

  reportFollowUps('runtime:stop', report.followups, { json: options.json });
  return 0;
}

/**
 * What to do with a stopped app.
 *
 * `navigate /` leads because starting it again is the only thing this state is for, and it is the
 * one command that both starts the app and puts it somewhere known.
 *
 * Exported for its own test: the one branch that matters is the three-way on `wasRunning`, and the
 * `null` arm is only reachable on a cloud session.
 */
export function buildStopFollowUps(report: RuntimeStopResultJson): FollowUp[] {
  // A mismatch gets the corrected command and nothing else. The old list led with `navigate /`
  // here, which starts an app while the one the caller meant to stop is still running — advice
  // built on the assumption that the requested id was the right one (friction run 4, F42).
  if (report.appIdMismatch) {
    return [
      {
        id: 'stop-connected-app',
        command: `${PROGRAM_PREFIX} runtime:stop --app-id ${report.connectedAppIds[0]}`,
        why: `${report.bundleId} was not running, so nothing was stopped. ${report.connectedAppIds[0]} is the app connected to the dev server, and this is the same command aimed at it.`,
      },
    ];
  }
  // `--cloud` is carried through: the app was stopped on the session, and `navigate /` without the
  // flag would look for a device on this machine — which is the machine that has none.
  //
  // On a local backend the **platform** is carried for the same reason and it is F103: this command
  // stopped the app on one device, and `navigate /` with no flag opens it on whichever device the
  // host defaults to — the iOS simulator, on a Mac, after a stop on the emulator. A cloud session
  // needs no platform beside `--cloud`, which already names the one device it has.
  const onCloud = report.deviceBackend === 'cloud';
  const flag = onCloud ? ' --cloud' : ` --${report.platform}`;
  return [
    {
      id: 'navigate',
      command: `${PROGRAM_PREFIX} navigate /${flag}`,
      // Three arms, not two. `wasRunning: null` is the cloud case — the controller closes the app
      // in front and says nothing about which id that was — and a falsy check read it as `false`,
      // so the follow-up asserted "The app was not running" about an app that was [live staging,
      // S13: Expo Go was running, `wasRunning: null`, and the line said it was not].
      why:
        report.wasRunning == null
          ? `Whether the app was running is not something the session's controller reports, so this starts it on the root route either way${onCloud ? ', on the same cloud simulator session' : ''}.`
          : report.wasRunning
            ? `The app is stopped, so this starts it again on the root route with a clean JavaScript runtime${onCloud ? ', on the same cloud simulator session' : ''}.`
            : `The app was not running, so this is what starts it on the root route${onCloud ? ', on the same cloud simulator session' : ''}.`,
    },
  ];
}

function printHumanReport(report: RuntimeStopResultJson): void {
  Log.log(
    [
      // A mismatch says "no" on the first line. `Stopped yes · it was not running` is true of the
      // id that was asked about and reads as "the app is stopped", which is the misreading F42 is.
      chalk`{bold Stopped} ${
        report.appIdMismatch
          ? chalk.red('no')
          : report.stopped
            ? chalk.green('yes')
            : chalk.red('no')
      }${
        report.appIdMismatch
          ? chalk.dim(
              ` · ${report.bundleId} was not running, and ${report.connectedAppIds.join(', ')} is`
            )
          : // Null rather than false: the cloud verb reported success and said nothing about which
            // app, so the line says that instead of "it was not running" — which would be a claim
            // about the id that nothing established.
            report.stopped && report.wasRunning == null
            ? chalk.dim(
                ' · the session closed the app in front; whether it was this one is not something the controller reports'
              )
            : report.stopped && !report.wasRunning
              ? chalk.dim(' · it was not running')
              : ''
      }`,
      chalk`{bold App} ${report.bundleId}${chalk.dim(` · ${report.bundleIdReason}`)}`,
      ...(report.connectedAppIds.length > 0
        ? [chalk`{bold Connected} ${report.connectedAppIds.join(', ')}`]
        : []),
      chalk`{bold Device} ${report.platform} ${report.deviceId}${chalk.dim(` · ${report.deviceBackend}`)}`,
      chalk.dim(` ${report.command}`),
    ].join('\n')
  );
}
