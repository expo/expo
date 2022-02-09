import { getConfig } from '@expo/config';
import semver from 'semver';

import { getVersionsAsync } from '../../../api/getVersions';
import { downloadExpoGoAsync } from '../../../utils/downloadExpoGoAsync';
import { logNewSection } from '../../../utils/ora';
import { confirmAsync } from '../../../utils/prompts';
import { VirtualDeviceManager } from '../VirtualDeviceManager';
import { SimulatorDevice } from './SimControl';

const EXPO_GO_IOS_APPLICATION_ID = 'host.exp.Exponent';

async function isClientOutdatedAsync<IDevice>(
  device: VirtualDeviceManager<IDevice>,
  sdkVersion?: string
): Promise<boolean> {
  const versions = await getVersionsAsync();
  const clientForSdk = await getClientForSDK(sdkVersion);
  const latestVersionForSdk = clientForSdk?.version ?? versions.iosVersion;
  const installedVersion = await device.getAppVersionAsync(EXPO_GO_IOS_APPLICATION_ID);
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
    url: sdkVersion.iosClientUrl,
    version: sdkVersion.iosClientVersion,
  };
}

/** Returns a boolean indicating if Expo Go should be installed. */
async function uninstallExpoGoIfOutdatedAsync<IDevice extends SimulatorDevice>(
  projectRoot: string,
  deviceManager: VirtualDeviceManager<IDevice>
) {
  const promptKey = deviceManager.device.udid ?? 'unknown';

  if (hasPromptedToUpgrade[promptKey]) {
    return false;
  }
  const { exp } = getConfig(projectRoot);
  if (await isClientOutdatedAsync(deviceManager, exp.sdkVersion)) {
    // Only prompt once per device, per run.
    hasPromptedToUpgrade[promptKey] = true;
    const confirm = await confirmAsync({
      initial: true,
      message: `Expo Go on ${deviceManager.name} is outdated, would you like to upgrade?`,
    });
    if (confirm) {
      // Don't need to uninstall to update on iOS.

      //   Log.log(`Uninstalling Expo Go from iOS device ${deviceManager.name}.`);
      //   await deviceManager.uninstallAppAsync(EXPO_GO_IOS_APPLICATION_ID);
      return true;
    }
  }
  return false;
}

export async function ensureDeviceHasValidExpoGoAsync<IDevice extends SimulatorDevice>(
  projectRoot: string,
  deviceManager: VirtualDeviceManager<IDevice>
): Promise<boolean> {
  let shouldInstall = !(await deviceManager.isAppInstalledAsync(EXPO_GO_IOS_APPLICATION_ID));

  if (!shouldInstall) {
    shouldInstall = await uninstallExpoGoIfOutdatedAsync(projectRoot, deviceManager);
  }

  if (shouldInstall) {
    // Download the Expo Go app from the Expo servers.
    const binaryPath = await downloadExpoGoAsync('ios');
    // Install the app on the device.
    const ora = logNewSection(`Installing Expo Go on ${deviceManager.name}`);
    await deviceManager.installAppAsync(binaryPath);
    ora.stop();
    return true;
  }
  return false;
}
