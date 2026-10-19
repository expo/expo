import assert from 'assert';
import chalk from 'chalk';

import * as Log from '../../../log';
import { AbortCommandError, CommandError } from '../../../utils/errors';
import { installExitHooks } from '../../../utils/exit';
import { validateUrl } from '../../../utils/url';
import { DeviceManager } from '../DeviceManager';
import { ExpoGoInstaller } from '../ExpoGoInstaller';
import type { BaseResolveDeviceProps } from '../PlatformManager';
import { activateWindowAsync } from './activateWindow';
import * as AndroidDebugBridge from './adb';
import { isAdbDeviceStateUsable } from './adbDeviceList';
import {
  createAdbOperationError,
  formatAdbDeviceError,
  isAdbDeviceDisconnectedError,
} from './adbDiagnostics';
import { AdbProcessError } from './adbProcess';
import { startDeviceAsync } from './emulator';
import { getDevicesAsync } from './getDevices';
import { promptForDeviceAsync } from './promptAndroidDevice';

const EXPO_GO_APPLICATION_IDENTIFIER = 'host.exp.exponent';

export class AndroidDeviceManager extends DeviceManager<AndroidDebugBridge.Device> {
  static async resolveFromNameAsync(query: string): Promise<AndroidDeviceManager> {
    const devices = await getDevicesAsync();
    const device =
      devices.find((device) => device.pid === query) ??
      devices.find((device) => device.name === query);

    if (!device) {
      const message = [
        `No connected Android device or emulator matched "${query}" by serial or name.`,
        'Available devices:',
        ...devices.map(
          (device) => `  ${device.name} (${device.pid ?? 'not attached'}, ${device.type})`
        ),
        'Pass a device serial from `adb devices` or a name from the list above to --device.',
      ].join('\n');
      throw new CommandError('BAD_ARGS', message);
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
    const info = await this.runDeviceOperationAsync((signal) =>
      AndroidDebugBridge.getPackageInfoAsync(
        this.device,
        {
          appId: applicationId,
        },
        signal
      )
    );

    const regex = /versionName=([0-9.]+)/;
    return regex.exec(info)?.[1] ?? null;
  }

  protected async attemptToStartAsync(): Promise<AndroidDebugBridge.Device | null> {
    // Only detached AVD inventory entries may enter the emulator launch path
    if (this.device.isLaunchable) {
      const attachedDevice = await AndroidDebugBridge.isDeviceBootedAsync(this.device);
      if (attachedDevice) {
        this.assertDeviceStateIsUsable(attachedDevice);
        this.device = attachedDevice;
      } else {
        this.device = await startDeviceAsync(this.device);
      }
    } else {
      this.assertDeviceStateIsUsable(this.device);
      const attachedDevice = await AndroidDebugBridge.isDeviceBootedAsync(this.device);
      if (!attachedDevice) {
        throw this.createDeviceStateError(
          new Error(`Device not found after discovery: ${this.device.pid ?? this.device.name}.`)
        );
      }
      this.assertDeviceStateIsUsable(attachedDevice);
      if (
        this.device.transportId &&
        attachedDevice.transportId &&
        this.device.transportId !== attachedDevice.transportId
      ) {
        throw this.createDeviceStateError(
          new Error(
            `Device ${this.device.pid ?? this.device.name} was replaced after discovery (transport ${this.device.transportId} became ${attachedDevice.transportId})`
          ),
          attachedDevice
        );
      }
      this.device = attachedDevice;
    }

    if (this.device.isAuthorized === false) {
      AndroidDebugBridge.logUnauthorized(this.device);
      throw this.createDeviceStateError(
        new Error(`Device ${this.device.pid ?? this.device.name} is unauthorized.`)
      );
    }

    return this.device;
  }

  private assertDeviceStateIsUsable(device: AndroidDebugBridge.Device): void {
    // Exclude unauthorized states, which are checked separately
    if (device.state === 'unauthorized') {
      return;
    }

    if (device.state && !isAdbDeviceStateUsable(device.state)) {
      throw this.createDeviceStateError(
        new Error(`Device ${device.pid ?? device.name} is in state ${device.state}.`),
        device
      );
    }
  }

  private createDeviceStateError(
    error: Error,
    device: AndroidDebugBridge.Device = this.device
  ): CommandError {
    return new CommandError('ADB_DEVICE_STATE', formatAdbDeviceError(error, device));
  }

  private async mapDeviceOperationError(error: unknown): Promise<never> {
    if (error instanceof CommandError) {
      throw error;
    }
    if (isAdbDeviceDisconnectedError(error)) {
      throw new CommandError('ADB_DEVICE_DISCONNECTED', formatAdbDeviceError(error, this.device));
    }
    if (error instanceof AdbProcessError) {
      throw createAdbOperationError('ADB_DEVICE_OPERATION', error, this.device);
    }
    throw error;
  }

  private async runDeviceOperationAsync<T>(
    operation: (signal: AbortSignal) => Promise<T>
  ): Promise<T> {
    // NOTE(@kitten): Do not retry device commands; side effects may already have started
    const controller = new AbortController();
    const removeExitHook = installExitHooks(() => controller.abort(new AbortCommandError()));
    try {
      return await operation(controller.signal);
    } catch (error) {
      return await this.mapDeviceOperationError(error);
    } finally {
      removeExitHook();
    }
  }

  async startAsync(): Promise<AndroidDebugBridge.Device> {
    const device = await this.attemptToStartAsync();
    assert(device, `Failed to boot emulator.`);
    return this.device;
  }

  async installAppAsync(binaryPath: string) {
    await this.runDeviceOperationAsync((signal) =>
      AndroidDebugBridge.installAsync(this.device, { filePath: binaryPath }, signal)
    );
  }

  async uninstallAppAsync(appId: string) {
    // we need to check if the app is installed, else we might bump into "Failure [DELETE_FAILED_INTERNAL_ERROR]"
    const isInstalled = await this.isAppInstalledAndIfSoReturnContainerPathForIOSAsync(appId);
    if (!isInstalled) {
      return;
    }

    try {
      await this.runDeviceOperationAsync((signal) =>
        AndroidDebugBridge.uninstallAsync(this.device, { appId }, signal)
      );
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
  async launchActivityAsync(launchActivity: string, url?: string): Promise<string> {
    try {
      return await this.runDeviceOperationAsync((signal) =>
        AndroidDebugBridge.launchActivityAsync(this.device, { launchActivity, url }, signal)
      );
    } catch (error: any) {
      if (
        error instanceof CommandError &&
        error.code.startsWith('ADB_') &&
        error.code !== 'ADB_DEVICE_OPERATION'
      ) {
        throw error;
      }
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
    return await this.runDeviceOperationAsync((signal) =>
      AndroidDebugBridge.isPackageInstalledAsync(this.device, applicationId, signal)
    );
  }

  async openUrlAsync(url: string) {
    // Non-compliant URLs will be treated as application identifiers.
    if (!validateUrl(url, { requireProtocol: true })) {
      await this.launchActivityAsync(url);
      return;
    }

    const parsed = new URL(url);

    if (parsed.protocol === 'exp:') {
      await this.runDeviceOperationAsync((signal) =>
        AndroidDebugBridge.launchActivityAsync(
          { pid: this.device.pid },
          {
            launchActivity: `${EXPO_GO_APPLICATION_IDENTIFIER}/.experience.HomeActivity`,
          },
          signal
        )
      );
    }

    await this.runDeviceOperationAsync((signal) =>
      AndroidDebugBridge.openUrlAsync({ pid: this.device.pid }, { url }, signal)
    );
  }

  async activateWindowAsync() {
    // Bring the emulator window to the front on macos devices.
    await activateWindowAsync(this.device);
  }

  getExpoGoAppId(): string {
    return EXPO_GO_APPLICATION_IDENTIFIER;
  }

  async ensureExpoGoAsync(sdkVersion: string): Promise<boolean> {
    const installer = new ExpoGoInstaller('android', EXPO_GO_APPLICATION_IDENTIFIER, sdkVersion);
    return installer.ensureAsync(this);
  }
}
