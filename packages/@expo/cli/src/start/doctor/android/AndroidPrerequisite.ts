import chalk from 'chalk';
import { execSync } from 'child_process';
import open from 'open';

import { AbortCommandError } from '../../../utils/errors';
import { confirmAsync } from '../../../utils/prompts';
import { Prerequisite } from '../Prerequisite';

export async function isADBInstalledAsync() {
  try {
    execSync('adb --version', { stdio: 'ignore' });
    return true;
  } catch {
    console.error(chalk.red`Cannot find {bold adb} hooked into PATH on this machine!`);
    return false;
  }
}

export class AndroidPrerequisite extends Prerequisite {
  static instance = new AndroidPrerequisite();

  async assertImplementation(): Promise<void> {
    if (await isADBInstalledAsync()) {
      return;
    }

    const confirm = await confirmAsync({
      initial: true,
      message: chalk`{bold Android SDK} needs to be installed, ANDROID_HOME set and correctly hooked up to PATH. Would you like to open Expo docs to learn more?`,
    });

    if (confirm) {
      try {
        await open('https://docs.expo.dev/workflow/android-studio-emulator/');
      } catch {}
    }

    throw new AbortCommandError();
  }
}
