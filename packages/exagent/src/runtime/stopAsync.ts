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
import { followUpsEnabled, reportFollowUps, type FollowUp } from '../followups';
import * as Log from '../log';
import { resolveDeviceAsync } from '../navigate/device';
import { readConfiguredAppId, resolveAppId } from './appId';
import { stopAppOnDeviceAsync } from './appProcess';
import { discoverDevServerAsync } from './devServer';
import { debugEvent, event } from './events';
import type { RuntimeStopOptions } from './resolveStopOptions';

/**
 * Machine shape of `exagent runtime:stop --json`.
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
   */
  wasRunning: boolean;
  platform: string;
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
  followups: FollowUp[];
}

/**
 * Stop the app on a device.
 *
 * @returns the exit code: `0` the app is not running, `1` the device refused.
 */
export async function runtimeStopAsync(
  projectRoot: string,
  options: RuntimeStopOptions
): Promise<number> {
  const device = await resolveDeviceAsync(options.platform);

  // The dev server is consulted but never required: it is the strongest evidence for *which* app
  // is running, and an app can be running with no dev server behind it at all.
  const devServer = await discoverDevServerAsync(options.devServerUrl ?? undefined, {
    projectRoot,
  });
  const resolved = resolveAppId({
    platform: device.platform,
    appIdOverride: options.appId,
    targetAppIds: devServer.targets.map((target) => target.appId).filter(Boolean),
    configured: readConfiguredAppId(projectRoot, device.platform),
  });
  debugEvent('stop_app_resolved', { appId: resolved.appId, source: resolved.source });

  const result = await stopAppOnDeviceAsync({
    platform: device.platform,
    deviceId: device.deviceId,
    appId: resolved.appId,
  });

  const report: RuntimeStopResultJson = {
    stopped: result.ok,
    wasRunning: result.ok && !result.wasAlreadyStopped,
    platform: device.platform,
    deviceId: device.deviceId,
    bundleId: resolved.appId,
    bundleIdSource: resolved.source,
    bundleIdReason: resolved.reason,
    command: result.command,
    reason: result.ok ? null : result.reason,
    followups: [],
  };
  report.followups =
    result.ok && followUpsEnabled(options.followups) ? buildFollowUps(report) : [];

  event('stop_app_done', { stopped: report.stopped, wasRunning: report.wasRunning });
  cliEvent('runtime_stop', {
    stopped: report.stopped,
    wasRunning: report.wasRunning,
    platform: report.platform,
    deviceId: report.deviceId,
    bundleId: report.bundleId,
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
        `How: check that ${resolved.appId} is the app you meant — ${resolved.reason} — and pass --app-id to name another. ${
          device.platform === 'ios'
            ? 'Check that the simulator is booted with "xcrun simctl list devices booted".'
            : 'Check that the device is attached with "adb devices".'
        }`,
      ].join('\n')
    );
    return 1;
  }

  reportFollowUps('runtime:stop', report.followups, { json: options.json });
  return 0;
}

/**
 * What to do with a stopped app.
 *
 * `navigate /` leads because starting it again is the only thing this state is for, and it is the
 * one command that both starts the app and puts it somewhere known.
 */
function buildFollowUps(report: RuntimeStopResultJson): FollowUp[] {
  return [
    {
      id: 'navigate',
      command: 'npx exagent navigate /',
      why: report.wasRunning
        ? 'The app is stopped, so this starts it again on the root route with a clean JavaScript runtime.'
        : 'The app was not running, so this is what starts it on the root route.',
    },
  ];
}

function printHumanReport(report: RuntimeStopResultJson): void {
  Log.log(
    [
      chalk`{bold Stopped} ${report.stopped ? chalk.green('yes') : chalk.red('no')}${
        report.stopped && !report.wasRunning ? chalk.dim(' · it was not running') : ''
      }`,
      chalk`{bold App} ${report.bundleId}${chalk.dim(` · ${report.bundleIdReason}`)}`,
      chalk`{bold Device} ${report.platform} ${report.deviceId}`,
      chalk.dim(` ${report.command}`),
    ].join('\n')
  );
}
