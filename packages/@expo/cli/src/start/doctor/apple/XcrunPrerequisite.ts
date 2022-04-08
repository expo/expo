import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import { execSync } from 'child_process';

import { delayAsync } from '../../../utils/delay';
import { AbortCommandError } from '../../../utils/errors';
import { confirmAsync } from '../../../utils/prompts';
import { Prerequisite } from '../Prerequisite';

async function isXcrunInstalledAsync() {
  try {
    execSync('xcrun --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export class XcrunPrerequisite extends Prerequisite {
  static instance = new XcrunPrerequisite();

  /**
   * Ensure Xcode CLI is installed.
   */
  async assertImplementation(): Promise<void> {
    if (await isXcrunInstalledAsync()) {
      // Run this second to ensure the Xcode version check is run.
      return;
    }

    async function pendingAsync(): Promise<void> {
      if (!(await isXcrunInstalledAsync())) {
        await delayAsync(100);
        return await pendingAsync();
      }
    }

    // This prompt serves no purpose accept informing the user what to do next, we could just open the App Store but it could be confusing if they don't know what's going on.
    const confirm = await confirmAsync({
      initial: true,
      message: chalk`Xcode {bold Command Line Tools} needs to be installed (requires {bold sudo}), continue?`,
    });

    if (confirm) {
      try {
        await spawnAsync('sudo', [
          'xcode-select',
          '--install',
          // TODO: Is there any harm in skipping this?
          // '--switch', '/Applications/Xcode.app'
        ]);
        // Most likely the user will cancel the process, but if they don't this will continue checking until the CLI is available.
        return await pendingAsync();
      } catch {
        // TODO: Figure out why this might get called (cancel early, network issues, server problems)
        // TODO: Handle me
      }
    }

    throw new AbortCommandError();
  }
}
