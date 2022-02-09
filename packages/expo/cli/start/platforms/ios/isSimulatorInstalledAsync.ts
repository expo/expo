import * as osascript from '@expo/osascript';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import semver from 'semver';

import * as Log from '../../../log';
import { delayAsync } from '../../../utils/delay';
import { profile } from '../../../utils/profile';
import { confirmAsync } from '../../../utils/prompts';
import * as SimControl from './SimControl';
import * as Xcode from './xcode';

const SUGGESTED_XCODE_VERSION = `${Xcode.minimumVersion}.0`;

let _isXcodeCLIInstalled: boolean | null = null;
let _isSimulatorInstalled: null | boolean = null;

/**
 * Ensure Xcode is installed an recent enough to be used with Expo.
 *
 * @return true when Xcode is installed, false when the process should end.
 */
async function ensureXcodeInstalledAsync(): Promise<boolean> {
  const promptToOpenAppStoreAsync = async (message: string) => {
    // This prompt serves no purpose accept informing the user what to do next, we could just open the App Store but it could be confusing if they don't know what's going on.
    const confirm = await confirmAsync({ initial: true, message });
    if (confirm) {
      Log.log(`Going to the App Store, re-run Expo when Xcode is finished installing.`);
      Xcode.openAppStore(Xcode.appStoreId);
    }
  };

  const version = profile(Xcode.getXcodeVersion)();
  if (!version) {
    // Almost certainly Xcode isn't installed.
    await promptToOpenAppStoreAsync(
      `Xcode needs to be installed (don't worry, you won't have to use it), would you like to continue to the App Store?`
    );
    return false;
  }

  if (!semver.valid(version)) {
    // Not sure why this would happen, if it does we should add a more confident error message.
    Log.error(`Xcode version is in an unknown format: ${version}`);
    return false;
  }

  if (semver.lt(version, SUGGESTED_XCODE_VERSION)) {
    // Xcode version is too old.
    await promptToOpenAppStoreAsync(
      `Xcode (${version}) needs to be updated to at least version ${Xcode.minimumVersion}, would you like to continue to the App Store?`
    );
    return false;
  }

  return true;
}

async function ensureXcodeCommandLineToolsInstalledAsync(): Promise<boolean> {
  // NOTE(Bacon): See `isSimulatorInstalledAsync` for more info on why we cache this value.
  if (_isXcodeCLIInstalled != null) {
    return _isXcodeCLIInstalled;
  }
  const _ensureXcodeCommandLineToolsInstalledAsync = async () => {
    if (!(await ensureXcodeInstalledAsync())) {
      // Need Xcode to install the CLI afaict
      return false;
    } else if (await SimControl.isXcrunInstalledAsync()) {
      // Run this second to ensure the Xcode version check is run.
      return true;
    }

    async function pendingAsync(): Promise<boolean> {
      if (await SimControl.isXcrunInstalledAsync()) {
        return true;
      } else {
        await delayAsync(100);
        return await pendingAsync();
      }
    }

    // This prompt serves no purpose accept informing the user what to do next, we could just open the App Store but it could be confusing if they don't know what's going on.
    const confirm = await confirmAsync({
      initial: true,
      message: `Xcode ${chalk.bold`Command Line Tools`} needs to be installed (requires ${chalk.bold`sudo`}), continue?`,
    });

    if (!confirm) {
      return false;
    }

    try {
      await spawnAsync('sudo', [
        'xcode-select',
        '--install',
        // TODO: Is there any harm in skipping this?
        // '--switch', '/Applications/Xcode.app'
      ]);
      // Most likely the user will cancel the process, but if they don't this will continue checking until the CLI is available.
      await pendingAsync();
      return true;
    } catch (error) {
      // TODO: Figure out why this might get called (cancel early, network issues, server problems)
      // TODO: Handle me
    }
    return false;
  };
  _isXcodeCLIInstalled = await _ensureXcodeCommandLineToolsInstalledAsync();

  return _isXcodeCLIInstalled;
}

async function getSimulatorAppIdAsync(): Promise<string | null> {
  let result;
  try {
    result = (await osascript.execAsync('id of app "Simulator"')).trim();
  } catch {
    // This error may occur in CI where the users intends to install just the simulators but no Xcode.
    return null;
  }
  return result;
}

// Simulator installed
export async function isSimulatorInstalledAsync(): Promise<boolean> {
  if (_isSimulatorInstalled != null) {
    return _isSimulatorInstalled;
  }
  // NOTE(Bacon): This method can take upwards of 1-2s to run so we should cache the results per process.
  // If the user installs Xcode while expo start is running, they'll need to restart
  // the process for the command to work properly.
  // This is better than waiting 1-2s every time you want to open the app on iOS.
  const _isSimulatorInstalledAsync = async () => {
    // Check to ensure Xcode and its CLI are installed and up to date.
    if (!(await ensureXcodeCommandLineToolsInstalledAsync())) {
      return false;
    }
    // TODO: extract into ensureSimulatorInstalled method

    const result = await getSimulatorAppIdAsync();
    if (!result) {
      // This error may occur in CI where the users intends to install just the simulators but no Xcode.
      Log.error(
        "Can't determine id of Simulator app; the Simulator is most likely not installed on this machine. Run `sudo xcode-select -s /Applications/Xcode.app`"
      );
      return false;
    }
    if (
      result !== 'com.apple.iphonesimulator' &&
      result !== 'com.apple.CoreSimulator.SimulatorTrampoline'
    ) {
      // TODO: FYI
      Log.warn(
        "Simulator is installed but is identified as '" + result + "'; don't know what that is."
      );
      return false;
    }

    // make sure we can run simctl
    try {
      await SimControl.simctlAsync(['help']);
    } catch (e) {
      if (e.isXDLError) {
        Log.error(e.toString());
      } else {
        Log.warn(`Unable to run simctl: ${e.toString()}`);
        Log.error(
          'xcrun may not be configured correctly. Try running `sudo xcode-select --reset` and running this again.'
        );
      }
      return false;
    }

    return true;
  };
  _isSimulatorInstalled = await _isSimulatorInstalledAsync();

  return _isSimulatorInstalled;
}
