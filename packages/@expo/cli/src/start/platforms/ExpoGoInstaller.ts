import semver from 'semver';

import type { DeviceManager } from './DeviceManager';
import { getVersionsAsync } from '../../api/getVersions';
import * as Log from '../../log';
import { downloadExpoGoAsync } from '../../utils/downloadExpoGoAsync';
import { env } from '../../utils/env';
import { CommandError } from '../../utils/errors';
import { learnMore } from '../../utils/link';
import { logNewSection } from '../../utils/ora';
import { confirmAsync } from '../../utils/prompts';

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
    private sdkVersion: string
  ) {}

  /** Returns true if the installed app matching the previously provided `appId` is outdated. */
  isInstalledClientVersionMismatched(
    installedVersion: string | null,
    expectedExpoGoVersion: string | null
  ): boolean {
    if (!installedVersion) {
      return true;
    }

    debug(
      `Expected Expo Go version: ${expectedExpoGoVersion}, installed version: ${installedVersion}`
    );
    return expectedExpoGoVersion ? !semver.eq(installedVersion, expectedExpoGoVersion) : true;
  }

  /** Returns the expected version of Expo Go given the project SDK Version. Exposed for testing. */
  async getExpectedExpoGoClientVersionAsync(): Promise<string | null> {
    const versions = await getVersionsAsync();
    // Like `sdkVersions['44.0.0']['androidClientVersion'] = '1.0.0'`
    const specificVersion =
      versions?.sdkVersions?.[this.sdkVersion]?.[`${this.platform}ClientVersion`];
    const latestVersion = versions[`${this.platform}Version`];
    return specificVersion ?? latestVersion ?? null;
  }

  /** Returns a boolean indicating if Expo Go should be installed. Returns `true` if the app was uninstalled. */
  async promptForUninstallExpoGoIfInstalledClientVersionMismatchedAndReturnShouldInstallAsync(
    deviceManager: DeviceManager<IDevice>,
    { containerPath }: { containerPath?: string } = {}
  ): Promise<boolean> {
    const cacheId = `${this.platform}-${deviceManager.identifier}`;

    if (ExpoGoInstaller.cache[cacheId]) {
      debug('skipping subsequent upgrade check');
      return false;
    }
    ExpoGoInstaller.cache[cacheId] = true;

    const [installedExpoGoVersion, expectedExpoGoVersion] = await Promise.all([
      deviceManager.getAppVersionAsync(this.appId, {
        containerPath,
      }),
      this.getExpectedExpoGoClientVersionAsync(),
    ]);

    if (this.isInstalledClientVersionMismatched(installedExpoGoVersion, expectedExpoGoVersion)) {
      if (this.sdkVersion === 'UNVERSIONED') {
        // This should only happen in the expo/expo repo, e.g. `apps/test-suite`
        Log.log(
          `Skipping Expo Go upgrade check for UNVERSIONED project. Manually ensure the Expo Go app is built from source.`
        );
        return false;
      }

      // Only prompt once per device, per run.
      const confirm = await confirmAsync({
        initial: true,
        message: `Expo Go ${expectedExpoGoVersion} is recommended for SDK ${this.sdkVersion} (${
          deviceManager.name
        }
          is using ${installedExpoGoVersion}). ${learnMore(
            'https://docs.expo.dev/get-started/expo-go/#sdk-versions'
          )}. Install the recommended Expo Go version?`,
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
    const isExpoGoInstalledAndIfSoContainerPathForIOS =
      await deviceManager.isAppInstalledAndIfSoReturnContainerPathForIOSAsync(this.appId);
    let shouldInstall = !isExpoGoInstalledAndIfSoContainerPathForIOS;
    if (env.EXPO_OFFLINE) {
      if (isExpoGoInstalledAndIfSoContainerPathForIOS) {
        Log.warn(`Skipping Expo Go version validation in offline mode`);
        return false;
      }
      throw new CommandError(
        'NO_EXPO_GO',
        `Expo Go is not installed on device "${deviceManager.name}", while running in offline mode. Manually install Expo Go or run without --offline flag (or EXPO_OFFLINE environment variable).`
      );
    }

    if (isExpoGoInstalledAndIfSoContainerPathForIOS) {
      shouldInstall =
        await this.promptForUninstallExpoGoIfInstalledClientVersionMismatchedAndReturnShouldInstallAsync(
          deviceManager,
          {
            // iOS optimization to prevent duplicate calls to `getContainerPathAsync`.
            containerPath:
              typeof isExpoGoInstalledAndIfSoContainerPathForIOS === 'string'
                ? isExpoGoInstalledAndIfSoContainerPathForIOS
                : undefined,
          }
        );
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
