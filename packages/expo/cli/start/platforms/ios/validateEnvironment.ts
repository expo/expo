import * as osascript from '@expo/osascript';
import spawnAsync from '@expo/spawn-async';
import assert from 'assert';
import chalk from 'chalk';
import { execSync } from 'child_process';

import * as Log from '../../../log';
import { delayAsync } from '../../../utils/delay';
import { memoize } from '../../../utils/fn';
import { profile } from '../../../utils/profile';
import { confirmAsync } from '../../../utils/prompts';
import * as SimControl from './simctl';
import { ensureXcodeInstalledAsync } from './xcode';

async function isXcrunInstalledAsync() {
  try {
    execSync('xcrun --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const ensureXcodeCommandLineToolsInstalledAsync = memoize(async (): Promise<boolean> => {
  if (!(await ensureXcodeInstalledAsync())) {
    // Need Xcode to install the CLI afaict
    return false;
  } else if (await isXcrunInstalledAsync()) {
    // Run this second to ensure the Xcode version check is run.
    return true;
  }

  async function pendingAsync(): Promise<boolean> {
    if (await isXcrunInstalledAsync()) {
      return true;
    } else {
      await delayAsync(100);
      return await pendingAsync();
    }
  }

  // This prompt serves no purpose accept informing the user what to do next, we could just open the App Store but it could be confusing if they don't know what's going on.
  const confirm = await confirmAsync({
    initial: true,
    message: chalk`Xcode {bold Command Line Tools} needs to be installed (requires {bold sudo}), continue?`,
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
});

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

// NOTE(Bacon): This method can take upwards of 1-2s to run so we should cache the results per process.
// If the user installs Xcode while expo start is running, they'll need to restart
// the process for the command to work properly.
// This is better than waiting 1-2s every time you want to open the app on iOS.
const isSimulatorInstalledAsync = memoize(async (): Promise<boolean> => {
  // Check to ensure Xcode and its CLI are installed and up to date.
  if (!(await ensureXcodeCommandLineToolsInstalledAsync())) {
    return false;
  }

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
});

export async function validateEnvironmentAsync() {
  assert(
    await profile(isSimulatorInstalledAsync)(),
    'Unable to verify Xcode and Simulator installation.'
  );
}
