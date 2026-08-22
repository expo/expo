// @ref llp/0005-runtime-loop-tools.rfc.md
// Open a route of the project in the app on a booted device, so a change can be verified on the
// screen it belongs to instead of by hand.
import chalk from 'chalk';

import { event } from '../events';
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
  const { route, devServerUrl, platform, scheme, appId } = options;

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
    throw new CommandError('DEEP_LINK_UNRESOLVED', resolved.error);
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

  if (result.stdout.trim()) {
    Log.log(chalk.dim(result.stdout.trim()));
  }
  return 0;
}
