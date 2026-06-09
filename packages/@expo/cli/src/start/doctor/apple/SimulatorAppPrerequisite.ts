import { execAsync } from '@expo/osascript';
import spawnAsync from '@expo/spawn-async';
import path from 'path';

import * as Log from '../../../log';
import { Prerequisite, PrerequisiteCommandError } from '../Prerequisite';

const debug = require('debug')('expo:doctor:apple:simulatorApp') as typeof console.log;

/**
 * Bundle identifier of DeviceHub.app, which replaced the standalone Simulator.app in Xcode 27.
 */
const DEVICE_HUB_BUNDLE_IDENTIFIER = 'com.apple.dt.Devices';

/**
 * Get the bundle ID of the simulator host app via AppleScript / LaunchServices.
 * Checks both Simulator.app and Xcode 27's DeviceHub.app. May return null if neither is
 * registered in LaunchServices (e.g. when Xcode lives on an external or renamed volume).
 */
async function getSimulatorAppIdViaAppleScriptAsync(): Promise<string | null> {
  for (const appName of ['Simulator', 'DeviceHub']) {
    try {
      const id = (await execAsync(`id of app "${appName}"`)).trim();
      if (id) {
        return id;
      }
    } catch {
      // This error may occur in CI where the user intends to install just the simulators but no
      // Xcode, or when the app is not registered in LaunchServices (e.g. Xcode on an external or
      // renamed volume).
    }
  }
  return null;
}

/**
 * Fallback: locate the simulator host app via the active Xcode developer directory and read its
 * CFBundleIdentifier directly from the app bundle's Info.plist. This works even when
 * LaunchServices hasn't indexed the app. Xcode 27 moved the developer apps from
 * Contents/Developer/Applications up to Contents/Applications and replaced Simulator.app with
 * DeviceHub.app, so several candidate locations are checked.
 */
async function getSimulatorAppIdFromBundleAsync(): Promise<string | null> {
  try {
    const { stdout: developerDir } = await spawnAsync('xcode-select', ['--print-path']);
    const root = developerDir.trim();
    const candidates = [
      path.join(root, 'Applications', 'Simulator.app', 'Contents', 'Info.plist'),
      path.join(root, '..', 'Applications', 'DeviceHub.app', 'Contents', 'Info.plist'),
      path.join(root, 'Applications', 'DeviceHub.app', 'Contents', 'Info.plist'),
    ];
    for (const infoPlist of candidates) {
      try {
        const { stdout: bundleId } = await spawnAsync('defaults', [
          'read',
          infoPlist,
          'CFBundleIdentifier',
        ]);
        if (bundleId.trim()) {
          return bundleId.trim();
        }
      } catch {
        // This candidate app isn't present at this path; try the next one.
      }
    }
  } catch {
    // Neither app found at the expected path or xcode-select is unavailable.
  }
  return null;
}

async function getSimulatorAppIdAsync(): Promise<string | null> {
  return (
    (await getSimulatorAppIdViaAppleScriptAsync()) ?? (await getSimulatorAppIdFromBundleAsync())
  );
}

export class SimulatorAppPrerequisite extends Prerequisite {
  static instance = new SimulatorAppPrerequisite();

  async assertImplementation(): Promise<void> {
    const result = await getSimulatorAppIdAsync();
    if (!result) {
      // This error may occur in CI where the users intends to install just the simulators but no Xcode.
      throw new PrerequisiteCommandError(
        'SIMULATOR_APP',
        "Can't determine id of Simulator app; the Simulator is most likely not installed on this machine. Run `sudo xcode-select -s /Applications/Xcode.app`"
      );
    }
    if (
      result !== 'com.apple.iphonesimulator' &&
      result !== 'com.apple.CoreSimulator.SimulatorTrampoline' &&
      result !== DEVICE_HUB_BUNDLE_IDENTIFIER
    ) {
      throw new PrerequisiteCommandError(
        'SIMULATOR_APP',
        "Simulator is installed but is identified as '" + result + "'; don't know what that is."
      );
    }
    debug(`Simulator app id: ${result}`);

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
