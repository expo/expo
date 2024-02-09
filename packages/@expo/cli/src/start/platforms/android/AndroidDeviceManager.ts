import assert from 'assert';
import chalk from 'chalk';

import { activateWindowAsync } from './activateWindow';
import * as AndroidDebugBridge from './adb';
import { startDeviceAsync } from './emulator';
import { getDevicesAsync } from './getDevices';
import { promptForDeviceAsync } from './promptAndroidDevice';
import * as Log from '../../../log';
import { AbortCommandError, CommandError } from '../../../utils/errors';
import { validateUrl } from '../../../utils/url';
import { DeviceManager } from '../DeviceManager';
import { ExpoGoInstaller } from '../ExpoGoInstaller';
import { BaseResolveDeviceProps } from '../PlatformManager';

const EXPO_GO_APPLICATION_IDENTIFIER = 'host.exp.exponent';

export class AndroidDeviceManager extends DeviceManager<AndroidDebugBridge.Device> {
  static async resolveFromNameAsync(name: string): Promise<AndroidDeviceManager> {
    const devices = await getDevicesAsync();
    const device = devices.find((device) => device.name === name);

    if (!device) {
      throw new CommandError('Could not find device with name: ' + name);
    }
    return AndroidDeviceManager.resolveAsync({ device, shouldPrompt: false });
  }

  static async resolveAsync({
    device,
    shouldPrompt,
  }: BaseResolveDeviceProps<AndroidDebugBridge.Device> = {}): Promise<AndroidDeviceManager> {
    if (device) {
      const manager = new AndroidDeviceManager(device);
      if (!(await manager.attemptToStartAsync())) {
        throw new AbortCommandError();
      }
      return manager;
    }

    const devices = await getDevicesAsync();
    const _device = shouldPrompt ? await promptForDeviceAsync(devices) : devices[0];
    return AndroidDeviceManager.resolveAsync({ device: _device, shouldPrompt: false });
  }

  get name() {
    // TODO: Maybe strip `_` from the device name?
    return this.device.name;
  }

  get identifier(): string {
    return this.device.pid ?? 'unknown';
  }

  async getAppVersionAsync(applicationId: string): Promise<string | null> {
    const info = await AndroidDebugBridge.getPackageInfoAsync(this.device, {
      appId: applicationId,
    });

    const regex = /versionName=([0-9.]+)/;
    return regex.exec(info)?.[1] ?? null;
  }

  protected async attemptToStartAsync(): Promise<AndroidDebugBridge.Device | null> {
    // TODO: Add a light-weight method for checking since a device could disconnect.
    if (!(await AndroidDebugBridge.isDeviceBootedAsync(this.device))) {
      this.device = await startDeviceAsync(this.device);
    }

    if (this.device.isAuthorized === false) {
      AndroidDebugBridge.logUnauthorized(this.device);
      return null;
    }

    return this.device;
  }

  async startAsync(): Promise<AndroidDebugBridge.Device> {
    const device = await this.attemptToStartAsync();
    assert(device, `Failed to boot emulator.`);
    return this.device;
  }

  async installAppAsync(binaryPath: string) {
    await AndroidDebugBridge.installAsync(this.device, {
      filePath: binaryPath,
    });
  }

  async uninstallAppAsync(appId: string) {
    // we need to check if the app is installed, else we might bump into "Failure [DELETE_FAILED_INTERNAL_ERROR]"
    const isInstalled = await this.isAppInstalledAndIfSoReturnContainerPathForIOSAsync(appId);
    if (!isInstalled) {
      return;
    }

    try {
      await AndroidDebugBridge.uninstallAsync(this.device, {
        appId,
      });
    } catch (e) {
      Log.error(
        `Could not uninstall app "${appId}" from your device, please uninstall it manually and try again.`
      );
      throw e;
    }
  }

  /**
   * @param launchActivity Activity to launch `[application identifier]/.[main activity name]`, ex: `com.bacon.app/.MainActivity`
   */
  async launchActivityAsync(launchActivity: string): Promise<string> {
    try {
      return await AndroidDebugBridge.launchActivityAsync(this.device, {
        launchActivity,
      });
    } catch (error: any) {
      let errorMessage = `Couldn't open Android app with activity "${launchActivity}" on device "${this.name}".`;
      if (error instanceof CommandError && error.code === 'APP_NOT_INSTALLED') {
        errorMessage += `\nThe app might not be installed, try installing it with: ${chalk.bold(
          `npx expo run:android -d ${this.name}`
        )}`;
      }
      errorMessage += chalk.gray(`\n${error.message}`);
      error.message = errorMessage;
      throw error;
    }
  }

  async isAppInstalledAndIfSoReturnContainerPathForIOSAsync(applicationId: string) {
    return await AndroidDebugBridge.isPackageInstalledAsync(this.device, applicationId);
  }

  async openUrlAsync(url: string) {
    // Non-compliant URLs will be treated as application identifiers.
    if (!validateUrl(url, { requireProtocol: true })) {
      await this.launchActivityAsync(url);
      return;
    }

    const parsed = new URL(url);

    if (parsed.protocol === 'exp:') {
      // NOTE(brentvatne): temporary workaround! launch Expo Go first, then
      // launch the project!
      // https://github.com/expo/expo/issues/7772
      // adb shell monkey -p host.exp.exponent -c android.intent.category.LAUNCHER 1
      // Note: this is not needed in Expo Development Client, it only applies to Expo Go
      await AndroidDebugBridge.openAppIdAsync(
        { pid: this.device.pid },
        { applicationId: EXPO_GO_APPLICATION_IDENTIFIER }
      );
    }

    await AndroidDebugBridge.openUrlAsync({ pid: this.device.pid }, { url });
  }

  async activateWindowAsync() {
    // Bring the emulator window to the front on macos devices.
    await activateWindowAsync(this.device);
  }

  async ensureExpoGoAsync(sdkVersion: string): Promise<boolean> {
    const installer = new ExpoGoInstaller('android', EXPO_GO_APPLICATION_IDENTIFIER, sdkVersion);
    return installer.ensureAsync(this);
  }
}
