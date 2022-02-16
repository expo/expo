import { execAsync } from '@expo/osascript';
import spawnAsync from '@expo/spawn-async';

import * as Log from '../../../log';
import { CommandError } from '../../../utils/errors';
import { Prerequisite } from './Prerequisite';

async function getSimulatorAppIdAsync(): Promise<string | null> {
  try {
    return (await execAsync('id of app "Simulator"')).trim();
  } catch {
    // This error may occur in CI where the users intends to install just the simulators but no Xcode.
  }
  return null;
}

export class SimulatorAppPrerequisite extends Prerequisite {
  static instance = new SimulatorAppPrerequisite();

  async assertImplementation(): Promise<void> {
    const result = await getSimulatorAppIdAsync();
    if (!result) {
      // This error may occur in CI where the users intends to install just the simulators but no Xcode.
      throw new CommandError(
        'VALIDATE_SIMULATOR_APP',
        "Can't determine id of Simulator app; the Simulator is most likely not installed on this machine. Run `sudo xcode-select -s /Applications/Xcode.app`"
      );
    }
    if (
      result !== 'com.apple.iphonesimulator' &&
      result !== 'com.apple.CoreSimulator.SimulatorTrampoline'
    ) {
      throw new CommandError(
        'VALIDATE_SIMULATOR_APP',
        "Simulator is installed but is identified as '" + result + "'; don't know what that is."
      );
    }

    try {
      // make sure we can run simctl
      await spawnAsync('xcrun', ['simctl', 'help']);
    } catch (e) {
      Log.warn(`Unable to run simctl:\n${e.toString()}`);
      throw new CommandError(
        'VALIDATE_SIMCTL',
        'xcrun is not configured correctly. Ensure `sudo xcode-select --reset` works before running this command again.'
      );
    }
  }
}
