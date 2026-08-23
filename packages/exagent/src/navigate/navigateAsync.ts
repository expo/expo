// @ref llp/0005-runtime-loop-tools.rfc.md
// Open a route of the project in the app on a booted device, so a change can be verified on the
// screen it belongs to instead of by hand.
import chalk from 'chalk';

import { event } from '../events';
import {
  buildNavigateFollowUps,
  followUpsEnabled,
  reportFollowUps,
  type FollowUp,
} from '../followups';
import * as Log from '../log';
import { readProjectNativeDirsAsync } from '../project/nativeCode';
import {
  isInstalledDependencyAsync,
  listDependencyNames,
  readProjectPackageJsonAsync,
} from '../project/nodeModules';
import { probeDevServerAsync } from '../runtime/devServer';
import { CommandError } from '../utils/errors';
import { openUrlOnDeviceAsync, readProjectSchemeConfig, resolveDeepLinkUrl } from './deepLink';
import { resolveDeviceAsync } from './device';
import { debugEvent } from './events';
import type { NavigateOptions } from './resolveOptions';
import { decideExpoGoTarget } from './target';

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
 * @returns the exit code: non-zero when the device refused the deep link.
 */
export async function navigateAsync(
  projectRoot: string,
  options: NavigateOptions
): Promise<number> {
  const { route, devServerUrl, platform, scheme, appId, json, followups: wantFollowUps } = options;

  const [devServer, config, nativeDirs, packageJson] = await Promise.all([
    probeDevServerAsync(devServerUrl),
    Promise.resolve(readProjectSchemeConfig(projectRoot)),
    readProjectNativeDirsAsync(projectRoot),
    readProjectPackageJsonAsync(projectRoot),
  ]);
  const usesDevClient = await isInstalledDependencyAsync(
    projectRoot,
    listDependencyNames(packageJson),
    'expo-dev-client'
  );

  const target = decideExpoGoTarget({
    appIdOverride: appId,
    targetAppIds: devServer.targets.map((item) => item.appId).filter(Boolean),
    hasNativeDirs: nativeDirs.ios || nativeDirs.android,
    usesDevClient,
  });
  debugEvent('target_decided', target);

  const resolved = resolveDeepLinkUrl({
    route,
    schemeOverride: scheme,
    config,
    isExpoGo: target.isExpoGo,
    devServerUrl: devServer.reachable ? devServerUrl : null,
  });
  if (!resolved.ok) {
    const error = new CommandError('DEEP_LINK_UNRESOLVED', resolved.error);
    error.suggestedCommand = 'npx exagent navigate <route> --scheme <your-app-scheme>';
    throw error;
  }
  debugEvent('url_resolved', { url: resolved.url, resolution: resolved.resolution });

  const device = await resolveDeviceAsync(platform);
  const result = await openUrlOnDeviceAsync({
    platform: device.platform,
    deviceId: device.deviceId,
    url: resolved.url,
    appId,
  });

  event('navigate', {
    route,
    url: resolved.url,
    platform: device.platform,
    deviceId: device.deviceId,
    exitCode: result.exitCode,
  });

  // @ref llp/0009-smart-followups.rfc.md §Examples per command — `navigate`. Only a link the
  // device accepted has a screen to capture, so a refusal carries no follow-up: its own what/why/
  // how below is the next step.
  const followups =
    result.exitCode === 0 && followUpsEnabled(wantFollowUps)
      ? buildNavigateFollowUps({ platform: device.platform, deviceId: device.deviceId })
      : [];

  if (json) {
    const report: NavigateResultJson = {
      route,
      url: resolved.url,
      resolution: resolved.resolution,
      target: target.reason,
      platform: device.platform,
      deviceId: device.deviceId,
      appId: appId ?? null,
      command: result.command,
      exitCode: result.exitCode,
      followups,
    };
    // The object is the whole of stdout, so the output can be piped into a parser. The failure
    // below still explains itself, on stderr.
    Log.log(JSON.stringify(report, null, 2));
  } else {
    const deviceLabel = device.name ? `${device.name} (${device.deviceId})` : device.deviceId;
    Log.log(
      [
        chalk`{bold URL} ${resolved.url}`,
        chalk`{dim  ${resolved.resolution}}`,
        chalk`{dim  target: ${target.reason}}`,
        chalk`{bold Device} ${device.platform} ${deviceLabel}`,
        chalk`{dim  ${result.command}}`,
      ].join('\n')
    );
  }

  if (result.exitCode !== 0) {
    Log.error(
      [
        chalk.red(
          `The device did not open the deep link (${result.command} exited with ${result.exitCode ?? 'a signal'}).`
        ),
        `Why: ${result.stderr.trim() || result.stdout.trim() || 'the device tool reported no output.'}`,
        target.isExpoGo
          ? `How: make sure Expo Go is installed on this device and the dev server at ${devServerUrl} is running, then run this command again.`
          : `How: make sure the app is installed on this device and its scheme matches ${resolved.url.split('://')[0]}://. Rebuild the app after changing the "scheme" field, then run this command again.`,
      ].join('\n')
    );
    return 1;
  }

  // What the device tool printed is a note for a human, so it is left out of the JSON object
  // rather than added to it: `command` says how to read it again.
  if (!json && result.stdout.trim()) {
    Log.log(chalk.dim(result.stdout.trim()));
  }

  // Last, so the `Next (optional):` section is the last thing in the terminal, after what the device said.
  reportFollowUps('navigate', followups, { json });
  return 0;
}
