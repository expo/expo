import { safeIdOfAppAsync } from '@expo/osascript';
import spawnAsync from '@expo/spawn-async';
import path from 'node:path';

import * as Log from '../../../log';
import { Prerequisite, PrerequisiteCommandError } from '../Prerequisite';
import { XcodePrerequisite } from './XcodePrerequisite';

const debug = require('debug')('expo:doctor:apple:simulatorApp') as typeof console.log;

export class XcodeSimulatorPrerequisite extends Prerequisite {
  static instance = new XcodeSimulatorPrerequisite();

  async assertImplementation(): Promise<void> {
    const xcode = await XcodePrerequisite.instance.assertAsync();

    // Starting Xcode 27, Simulator has been replaced by Device Hub
    // See: https://developer.apple.com/documentation/xcode/device-hub
    if (xcode.version.major >= 27) {
      const deviceHubId = await safeIdOfAppAsync('DeviceHub').then((appId) => {
        return appId || getDeviceHubAppIdFromXcode(xcode.path);
      });

      if (!deviceHubId) {
        throw new PrerequisiteCommandError(
          'DEVICE_HUB_APP',
          "Can't determine id of Device Hub app; the Device Hub is most likely not installed on this machine. Run `sudo xcode-select -s /Applications/Xcode.app`"
        );
      }

      if (deviceHubId !== 'com.apple.dt.Devices') {
        throw new PrerequisiteCommandError(
          'DEVICE_HUB_APP',
          "Simulator is installed but is identified as '" +
            deviceHubId +
            "'; don't know what that is."
        );
      }

      debug(`Device Hub app id: ${deviceHubId}`);
    } else {
      // Fallback to legacy Simulator for Xcode <=26
      const simulatorId = await safeIdOfAppAsync('Simulator').then((appId) => {
        return appId || getSimulatorAppIdFromXcode(xcode.path);
      });

      if (!simulatorId) {
        // This error may occur in CI where the users intends to install just the simulators but no Xcode.
        throw new PrerequisiteCommandError(
          'SIMULATOR_APP',
          "Can't determine id of Simulator app; the Simulator is most likely not installed on this machine. Run `sudo xcode-select -s /Applications/Xcode.app`"
        );
      }

      if (
        simulatorId !== 'com.apple.iphonesimulator' &&
        simulatorId !== 'com.apple.CoreSimulator.SimulatorTrampoline'
      ) {
        throw new PrerequisiteCommandError(
          'SIMULATOR_APP',
          "Simulator is installed but is identified as '" +
            simulatorId +
            "'; don't know what that is."
        );
      }

      debug(`Simulator app id: ${simulatorId}`);
    }

    try {
      // make sure we can run simctl with either Simulator or Device Hub
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

/**
 * Get the bundle ID of the DeviceHub.app via AppleScript / LaunchServices.
 * May return null if the DeviceHub.app is not registered in LaunchServices
 * (e.g. when Xcode lives on an external or renamed volume).
 * @see 
 * @note DeviceHub was introduced in Xcode 27 as a replacement for Simulator
 */
async function getDeviceHubAppIdFromOsaScript(): Promise<string | null> {
  try {
    const result = await spawnAppleScriptAsync('id of app "DeviceHub"');
    return result.stdout.trim();
  } catch (error) {
    // This error may occur in CI where the user intends to install just the simulators but no
    // Xcode, or when DeviceHub.app is not registered in LaunchServices (e.g. Xcode on an
    // external or renamed volume).
    return null;
  }
}

/**
 * Get the bundle ID of the Simulator.app via AppleScript / LaunchServices.
 * May return null if the Simulator.app is not registered in LaunchServices
 * (e.g. when Xcode lives on an external or renamed volume).
 * @note Simulator was replaced in Xcode 27 by DeviceHub
 */
async function getSimulatorAppIdFromOsaScript(): Promise<string | null> {
  try {
    const result = await spawnAppleScriptAsync('id of app "Simulator"');
    return result.stdout.trim();
  } catch (error) {
    // This error may occur in CI where the user intends to install just the simulators but no
    // Xcode, or when Simulator.app is not registered in LaunchServices (e.g. Xcode on an
    // external or renamed volume).
    return null;
  }
}

/**
 * Fallback: locate DeviceHub.app via the active Xcode developer directory and read its
 * CFBundleIdentifier directly from the app bundle's Info.plist.
 * This works even when LaunchServices hasn't indexed Simulator.app.
 */
async function getDeviceHubAppIdFromXcode(xcodePath: string): Promise<string | null> {
  try {
    const simulatorInfoPlist = path.join(
      xcodePath,
      '..',
      'Applications',
      'DeviceHub.app',
      'Contents',
      'Info.plist'
    );
    const { stdout: bundleId } = await spawnAsync('defaults', [
      'read',
      simulatorInfoPlist,
      'CFBundleIdentifier',
    ]);
    return bundleId.trim() || null;
  } catch {
    // DeviceHub.app not found at the expected path
  }
  return null;
}

/**
 * Fallback: locate Simulator.app via the active Xcode developer directory and read its
 * CFBundleIdentifier directly from the app bundle's Info.plist.
 * This works even when LaunchServices hasn't indexed Simulator.app.
 */
async function getSimulatorAppIdFromXcode(xcodePath: string): Promise<string | null> {
  try {
    const simulatorInfoPlist = path.join(
      xcodePath,
      'Applications',
      'Simulator.app',
      'Contents',
      'Info.plist'
    );
    const { stdout: bundleId } = await spawnAsync('defaults', [
      'read',
      simulatorInfoPlist,
      'CFBundleIdentifier',
    ]);
    return bundleId.trim() || null;
  } catch {
    // Simulator.app not found at the expected path
  }
  return null;
}
