import semver from 'semver';

import { getVersionsAsync } from '../../api/getVersions';
import { APISettings } from '../../api/settings';
import * as Log from '../../log';
import { downloadExpoGoAsync } from '../../utils/downloadExpoGoAsync';
import { CommandError } from '../../utils/errors';
import { logNewSection } from '../../utils/ora';
import { confirmAsync } from '../../utils/prompts';
import type { DeviceManager } from './DeviceManager';

const debug = require('debug')('expo:utils:ExpoGoInstaller') as typeof console.log;

/** Given a platform, appId, and sdkVersion, this module will ensure that Expo Go is up-to-date on the provided device. */
export class ExpoGoInstaller<IDevice> {
  // Keep a list of [platform-deviceId] so we can prevent asking multiple times if a user wants to upgrade.
  // This can prevent annoying interactions when they don't want to upgrade for whatever reason.
  static cache: Record<string, boolean> = {};

  constructor(
    private platform: 'ios' | 'android',
    // Ultimately this should be inlined since we know the platform.
    private appId: string,
    private sdkVersion?: string
  ) {}

  /** Returns true if the installed app matching the previously provided `appId` is outdated. */
  async isClientOutdatedAsync(device: DeviceManager<IDevice>): Promise<boolean> {
    const installedVersion = await device.getAppVersionAsync(this.appId);
    if (!installedVersion) {
      return true;
    }
    const version = await this._getExpectedClientVersionAsync();
    debug(`Expected Expo Go version: ${version}, installed version: ${installedVersion}`);
    return version ? !semver.eq(installedVersion, version) : true;
  }

  /** Returns the expected version of Expo Go given the project SDK Version. Exposed for testing. */
  async _getExpectedClientVersionAsync(): Promise<string | null> {
    const versions = await getVersionsAsync();
    // Like `sdkVersions['44.0.0']['androidClientVersion'] = '1.0.0'`
    const specificVersion =
      versions?.sdkVersions?.[this.sdkVersion!]?.[`${this.platform}ClientVersion`];
    const latestVersion = versions[`${this.platform}Version`];
    return specificVersion ?? latestVersion ?? null;
  }

  /** Returns a boolean indicating if Expo Go should be installed. Returns `true` if the app was uninstalled. */
  async uninstallExpoGoIfOutdatedAsync(deviceManager: DeviceManager<IDevice>): Promise<boolean> {
    const cacheId = `${this.platform}-${deviceManager.identifier}`;

    if (ExpoGoInstaller.cache[cacheId]) {
      debug('skipping subsequent upgrade check');
      return false;
    }
    ExpoGoInstaller.cache[cacheId] = true;
    if (await this.isClientOutdatedAsync(deviceManager)) {
      // Only prompt once per device, per run.
      const confirm = await confirmAsync({
        initial: true,
        message: `Expo Go on ${deviceManager.name} is outdated, would you like to upgrade?`,
      });
      if (confirm) {
        // Don't need to uninstall to update on iOS.
        if (this.platform !== 'ios') {
          Log.log(`Uninstalling Expo Go from ${this.platform} device ${deviceManager.name}.`);
          await deviceManager.uninstallAppAsync(this.appId);
        }
        return true;
      }
    }
    return false;
  }

  /** Check if a given device has Expo Go installed, if not then download and install it. */
  async ensureAsync(deviceManager: DeviceManager<IDevice>): Promise<boolean> {
    let shouldInstall = !(await deviceManager.isAppInstalledAsync(this.appId));

    if (APISettings.isOffline && !shouldInstall) {
      Log.warn(`Skipping Expo Go version validation in offline mode`);
      return false;
    } else if (APISettings.isOffline && shouldInstall) {
      throw new CommandError(
        'NO_EXPO_GO',
        `Expo Go is not installed on device "${deviceManager.name}", while running in offline mode. Manually install Expo Go or run without --offline flag.`
      );
    }

    if (!shouldInstall) {
      shouldInstall = await this.uninstallExpoGoIfOutdatedAsync(deviceManager);
    }

    if (shouldInstall) {
      // Download the Expo Go app from the Expo servers.
      const binaryPath = await downloadExpoGoAsync(this.platform, { sdkVersion: this.sdkVersion });
      // Install the app on the device.
      const ora = logNewSection(`Installing Expo Go on ${deviceManager.name}`);
      try {
        await deviceManager.installAppAsync(binaryPath);
      } finally {
        ora.stop();
      }
      return true;
    }
    return false;
  }
}
