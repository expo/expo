import { getConfig } from '@expo/config';
import semver from 'semver';

import { getVersionsAsync } from '../../../api/getVersions';
import * as Log from '../../../log';
import { downloadExpoGoAsync } from '../../../utils/downloadExpoGoAsync';
import { logNewSection } from '../../../utils/ora';
import { confirmAsync } from '../../../utils/prompts';
import { VirtualDeviceManager } from '../VirtualDeviceManager';
import { Device } from './AndroidDeviceBridge';

const EXPO_GO_ANDROID_APPLICATION_ID = 'host.exp.exponent';

async function isClientOutdatedAsync<IDevice>(
  device: VirtualDeviceManager<IDevice>,
  sdkVersion?: string
): Promise<boolean> {
  const versions = await getVersionsAsync();
  const clientForSdk = await getClientForSDK(sdkVersion);
  const latestVersionForSdk = clientForSdk?.version ?? versions.androidVersion;
  const installedVersion = await device.getAppVersionAsync(EXPO_GO_ANDROID_APPLICATION_ID);
  return !installedVersion || semver.lt(installedVersion, latestVersionForSdk);
}

// Keep a list of simulator UDIDs so we can prevent asking multiple times if a user wants to upgrade.
// This can prevent annoying interactions when they don't want to upgrade for whatever reason.
const hasPromptedToUpgrade: Record<string, boolean> = {};

async function getClientForSDK(sdkVersionString?: string) {
  if (!sdkVersionString) {
    return null;
  }

  const sdkVersion = (await getVersionsAsync())[sdkVersionString];
  if (!sdkVersion) {
    return null;
  }

  return {
    url: sdkVersion.androidClientUrl,
    version: sdkVersion.androidClientVersion,
  };
}

/** Returns a boolean indicating if Expo Go should be installed. */
async function uninstallExpoGoIfOutdatedAsync<IDevice extends Device>(
  projectRoot: string,
  deviceManager: VirtualDeviceManager<IDevice>
) {
  const promptKey = deviceManager.device.pid ?? 'unknown';

  if (hasPromptedToUpgrade[promptKey]) {
    return false;
  }
  const { exp } = getConfig(projectRoot);
  if (await isClientOutdatedAsync(deviceManager, exp.sdkVersion)) {
    // Only prompt once per device, per run.
    hasPromptedToUpgrade[promptKey] = true;
    const confirm = await confirmAsync({
      initial: true,
      message: `Expo Go on ${deviceManager.name} (${deviceManager.device.type}) is outdated, would you like to upgrade?`,
    });
    if (confirm) {
      Log.log(`Uninstalling Expo Go from Android device ${deviceManager.name}.`);
      await deviceManager.uninstallAppAsync(EXPO_GO_ANDROID_APPLICATION_ID);
      return true;
    }
  }
  return false;
}

export async function ensureDeviceHasValidExpoGoAsync<IDevice extends Device>(
  projectRoot: string,
  deviceManager: VirtualDeviceManager<IDevice>
): Promise<boolean> {
  let shouldInstall = !(await deviceManager.isAppInstalledAsync(EXPO_GO_ANDROID_APPLICATION_ID));

  if (!shouldInstall) {
    shouldInstall = await uninstallExpoGoIfOutdatedAsync(projectRoot, deviceManager);
  }

  if (shouldInstall) {
    // Download the Expo Go app from the Expo servers.
    const binaryPath = await downloadExpoGoAsync('android');
    // Install the app on the device.
    const ora = logNewSection(`Installing Expo Go on ${deviceManager.name}`);
    await deviceManager.installAppAsync(binaryPath);
    ora.stop();
    return true;
  }
  return false;
}
