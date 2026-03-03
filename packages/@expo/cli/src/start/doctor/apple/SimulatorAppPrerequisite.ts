import { execAsync } from '@expo/osascript';
import spawnAsync from '@expo/spawn-async';
import path from 'path';

import * as Log from '../../../log';
import { Prerequisite, PrerequisiteCommandError } from '../Prerequisite';

const debug = require('debug')('expo:doctor:apple:simulatorApp') as typeof console.log;

/**
 * Get the bundle ID of the Simulator.app via AppleScript / LaunchServices.
 * May return null if the Simulator.app is not registered in LaunchServices
 * (e.g. when Xcode lives on an external or renamed volume).
 */
async function getSimulatorAppIdViaAppleScriptAsync(): Promise<string | null> {
  try {
    return (await execAsync('id of app "Simulator"')).trim();
  } catch {
    // This error may occur in CI where the user intends to install just the simulators but no
    // Xcode, or when Simulator.app is not registered in LaunchServices (e.g. Xcode on an
    // external or renamed volume).
  }
  return null;
}

/**
 * Fallback: locate Simulator.app via the active Xcode developer directory and read its
 * CFBundleIdentifier directly from the app bundle's Info.plist.
 * This works even when LaunchServices hasn't indexed Simulator.app.
 */
async function getSimulatorAppIdFromBundleAsync(): Promise<string | null> {
  try {
    const { stdout: developerDir } = await spawnAsync('xcode-select', ['--print-path']);
    const simulatorInfoPlist = path.join(
      developerDir.trim(),
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
    // Simulator.app not found at the expected path or xcode-select is unavailable.
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
      result !== 'com.apple.CoreSimulator.SimulatorTrampoline'
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
