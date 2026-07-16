import { safeIdOfAppAsync } from '@expo/osascript';
import spawnAsync from '@expo/spawn-async';
import path from 'node:path';

import { Log } from '../../../log';
import { Prerequisite, PrerequisiteCommandError } from '../Prerequisite';
import { debugEvent } from '../events';

// NOTE(cedric): Xcode 27 Beta moved the `<xcode>/Contents/Developer/Applications` to `<xcode>/Contents/Applications`
const XCODE_DEVICE_HUB_PATH = '../Applications/DeviceHub.app/Contents/Info.plist';
const XCODE_SIMULATOR_PATH = './Applications/Simulator.app/Contents/Info.plist';

export class SimulatorAppPrerequisite extends Prerequisite {
  static instance = new SimulatorAppPrerequisite();

  async assertImplementation(): Promise<void> {
    // Xcode 27 replaces Simulator with DeviceHub
    // See: https://developer.apple.com/documentation/xcode/device-hub
    // TODO(cedric): once Xcode 27 stable is released, resolve DeviceHub first
    let appId = await safeIdOfAppAsync('Simulator').then((appId) => {
      return appId || safeIdOfAppAsync('DeviceHub');
    });

    if (!appId) {
      const xcodePath = await getXcodeSelectPath();
      debugEvent('simulator_xcode_select_path', { path: xcodePath });
      if (xcodePath) {
        appId = await getXcodeInfoPlistBundleId(path.join(xcodePath, XCODE_SIMULATOR_PATH)).then(
          (appId) => {
            return appId || getXcodeInfoPlistBundleId(path.join(xcodePath, XCODE_DEVICE_HUB_PATH));
          }
        );
      }
    }

    if (!appId) {
      throw new PrerequisiteCommandError(
        'SIMULATOR_APP',
        "Can't determine id of Device Hub or Simulator app; the Device Hub or Simulator is most likely not installed on this machine. Run `sudo xcode-select -s /Applications/Xcode.app`"
      );
    }

    if (
      appId !== 'com.apple.dt.Devices' &&
      appId !== 'com.apple.iphonesimulator' &&
      appId !== 'com.apple.CoreSimulator.SimulatorTrampoline'
    ) {
      throw new PrerequisiteCommandError(
        'SIMULATOR_APP',
        `Device Hub or Simulator is installed but is identified as '${appId}'; don't know what that is.`
      );
    }

    debugEvent('simulator_app_id', { appId });

    try {
      // make sure we can run simctl
      await spawnAsync('xcrun', ['simctl', 'help']);
    } catch (error: any) {
      Log.warn(`Unable to run simctl:\n${error.toString()}`);
      throw new PrerequisiteCommandError(
        'SIMCTL',
        'xcrun is not configured correctly. Ensure `sudo xcode-select --reset` works before running this command again.'
      );
    }
  }
}

async function getXcodeSelectPath() {
  try {
    const result = await spawnAsync('xcode-select', ['--print-path']);
    return result.stdout.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Read the Info.plist of an app within Xcode and return the bundle ID.
 * This uses `defaults read <path>/Info.plist CFBundleIdentifier`.
 */
async function getXcodeInfoPlistBundleId(infoPlistPath: string) {
  try {
    const result = await spawnAsync('defaults', ['read', infoPlistPath, 'CFBundleIdentifier']);
    return result.stdout.trim() || null;
  } catch {
    return null;
  }
}
