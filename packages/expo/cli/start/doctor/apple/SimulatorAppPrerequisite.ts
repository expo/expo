import { execAsync } from '@expo/osascript';

import * as Log from '../../../log';
import { CommandError } from '../../../utils/errors';
import * as SimControl from '../../platforms/ios/simctl';
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
        "Can't determine id of Simulator app; the Simulator is most likely not installed on this machine. Run `sudo xcode-select -s /Applications/Xcode.app`"
      );
    }
    if (
      result !== 'com.apple.iphonesimulator' &&
      result !== 'com.apple.CoreSimulator.SimulatorTrampoline'
    ) {
      throw new CommandError(
        "Simulator is installed but is identified as '" + result + "'; don't know what that is."
      );
    }

    // make sure we can run simctl
    try {
      await SimControl.simctlAsync(['help']);
    } catch (e) {
      if (e instanceof CommandError) {
        throw e;
      } else {
        Log.warn(`Unable to run simctl: ${e.toString()}`);
        throw new CommandError(
          'xcrun may not be configured correctly. Try running `sudo xcode-select --reset` and running this again.'
        );
      }
    }
  }
}
