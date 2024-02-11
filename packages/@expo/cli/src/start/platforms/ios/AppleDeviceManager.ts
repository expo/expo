import * as osascript from '@expo/osascript';
import assert from 'assert';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import { assertSystemRequirementsAsync } from './assertSystemRequirements';
import { ensureSimulatorAppRunningAsync } from './ensureSimulatorAppRunning';
import {
  getBestBootedSimulatorAsync,
  getBestUnbootedSimulatorAsync,
  getSelectableSimulatorsAsync,
} from './getBestSimulator';
import { promptAppleDeviceAsync } from './promptAppleDevice';
import * as SimControl from './simctl';
import { delayAsync, waitForActionAsync } from '../../../utils/delay';
import { CommandError } from '../../../utils/errors';
import { parsePlistAsync } from '../../../utils/plist';
import { validateUrl } from '../../../utils/url';
import { DeviceManager } from '../DeviceManager';
import { ExpoGoInstaller } from '../ExpoGoInstaller';
import { BaseResolveDeviceProps } from '../PlatformManager';

const debug = require('debug')('expo:start:platforms:ios:AppleDeviceManager') as typeof console.log;

const EXPO_GO_BUNDLE_IDENTIFIER = 'host.exp.Exponent';

/**
 * Ensure a simulator is booted and the Simulator app is opened.
 * This is where any timeout related error handling should live.
 */
export async function ensureSimulatorOpenAsync(
  { udid, osType }: Partial<Pick<SimControl.Device, 'udid' | 'osType'>> = {},
  tryAgain: boolean = true
): Promise<SimControl.Device> {
  // Use a default simulator if none was specified
  if (!udid) {
    // If a simulator is open, side step the entire booting sequence.
    const simulatorOpenedByApp = await getBestBootedSimulatorAsync({ osType });
    if (simulatorOpenedByApp) {
      return simulatorOpenedByApp;
    }

    // Otherwise, find the best possible simulator from user defaults and continue
    const bestUdid = await getBestUnbootedSimulatorAsync({ osType });
    if (!bestUdid) {
      throw new CommandError('No simulators found.');
    }
    udid = bestUdid;
  }

  const bootedDevice = await waitForActionAsync({
    action: () => {
      // Just for the type check.
      assert(udid);
      return SimControl.bootAsync({ udid });
    },
  });

  if (!bootedDevice) {
    // Give it a second chance, this might not be needed but it could potentially lead to a better UX on slower devices.
    if (tryAgain) {
      return await ensureSimulatorOpenAsync({ udid, osType }, false);
    }
    // TODO: We should eliminate all needs for a timeout error, it's bad UX to get an error about the simulator not starting while the user can clearly see it starting on their slow computer.
    throw new CommandError(
      'SIMULATOR_TIMEOUT',
      `Simulator didn't boot fast enough. Try opening Simulator first, then running your app.`
    );
  }
  return bootedDevice;
}
export class AppleDeviceManager extends DeviceManager<SimControl.Device> {
  static assertSystemRequirementsAsync = assertSystemRequirementsAsync;

  static async resolveAsync({
    device,
    shouldPrompt,
  }: BaseResolveDeviceProps<
    Partial<Pick<SimControl.Device, 'udid' | 'osType'>>
  > = {}): Promise<AppleDeviceManager> {
    if (shouldPrompt) {
      const devices = await getSelectableSimulatorsAsync(device);
      device = await promptAppleDeviceAsync(devices, device?.osType);
    }

    const booted = await ensureSimulatorOpenAsync(device);
    return new AppleDeviceManager(booted);
  }

  get name() {
    return this.device.name;
  }

  get identifier(): string {
    return this.device.udid;
  }

  async getAppVersionAsync(
    appId: string,
    { containerPath }: { containerPath?: string } = {}
  ): Promise<string | null> {
    return await SimControl.getInfoPlistValueAsync(this.device, {
      appId,
      key: 'CFBundleShortVersionString',
      containerPath,
    });
  }

  async startAsync(): Promise<SimControl.Device> {
    return ensureSimulatorOpenAsync({ osType: this.device.osType, udid: this.device.udid });
  }

  async launchApplicationIdAsync(appId: string) {
    try {
      const result = await SimControl.openAppIdAsync(this.device, {
        appId,
      });
      if (result.status === 0) {
        await this.activateWindowAsync();
      } else {
        throw new CommandError(result.stderr);
      }
    } catch (error: any) {
      let errorMessage = `Couldn't open iOS app with ID "${appId}" on device "${this.name}".`;
      if (error instanceof CommandError && error.code === 'APP_NOT_INSTALLED') {
        if (appId === EXPO_GO_BUNDLE_IDENTIFIER) {
          errorMessage = `Couldn't open Expo Go app on device "${this.name}". Please install.`;
        } else {
          errorMessage += `\nThe app might not be installed, try installing it with: ${chalk.bold(
            `npx expo run:ios -d ${this.device.udid}`
          )}`;
        }
      }
      if (error.stderr) {
        errorMessage += chalk.gray(`\n${error.stderr}`);
      } else if (error.message) {
        errorMessage += chalk.gray(`\n${error.message}`);
      }
      throw new CommandError(errorMessage);
    }
  }

  async installAppAsync(filePath: string) {
    await SimControl.installAsync(this.device, {
      filePath,
    });

    await this.waitForAppInstalledAsync(await this.getApplicationIdFromBundle(filePath));
  }

  private async getApplicationIdFromBundle(filePath: string): Promise<string> {
    debug('getApplicationIdFromBundle:', filePath);
    const builtInfoPlistPath = path.join(filePath, 'Info.plist');
    if (fs.existsSync(builtInfoPlistPath)) {
      const { CFBundleIdentifier } = await parsePlistAsync(builtInfoPlistPath);
      debug('getApplicationIdFromBundle: using built Info.plist', CFBundleIdentifier);
      return CFBundleIdentifier;
    }
    debug('getApplicationIdFromBundle: no Info.plist found');
    return EXPO_GO_BUNDLE_IDENTIFIER;
  }

  private async waitForAppInstalledAsync(applicationId: string): Promise<boolean> {
    while (true) {
      if (await this.isAppInstalledAndIfSoReturnContainerPathForIOSAsync(applicationId)) {
        return true;
      }
      await delayAsync(100);
    }
  }

  async uninstallAppAsync(appId: string) {
    await SimControl.uninstallAsync(this.device, {
      appId,
    });
  }

  async isAppInstalledAndIfSoReturnContainerPathForIOSAsync(appId: string) {
    return (
      (await SimControl.getContainerPathAsync(this.device, {
        appId,
      })) ?? false
    );
  }

  async openUrlAsync(url: string) {
    // Non-compliant URLs will be treated as application identifiers.
    if (!validateUrl(url, { requireProtocol: true })) {
      return await this.launchApplicationIdAsync(url);
    }

    try {
      await SimControl.openUrlAsync(this.device, { url });
    } catch (error: any) {
      // 194 means the device does not conform to a given URL, in this case we'll assume that the desired app is not installed.
      if (error.status === 194) {
        // An error was encountered processing the command (domain=NSOSStatusErrorDomain, code=-10814):
        // The operation couldn’t be completed. (OSStatus error -10814.)
        //
        // This can be thrown when no app conforms to the URI scheme that we attempted to open.
        throw new CommandError(
          'APP_NOT_INSTALLED',
          `Device ${this.device.name} (${this.device.udid}) has no app to handle the URI: ${url}`
        );
      }
      throw error;
    }
  }

  async activateWindowAsync() {
    await ensureSimulatorAppRunningAsync(this.device);
    // TODO: Focus the individual window
    await osascript.execAsync(`tell application "Simulator" to activate`);
  }

  async ensureExpoGoAsync(sdkVersion: string): Promise<boolean> {
    const installer = new ExpoGoInstaller('ios', EXPO_GO_BUNDLE_IDENTIFIER, sdkVersion);
    return installer.ensureAsync(this);
  }
}
