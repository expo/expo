import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import inquirer from 'inquirer';

import * as Directories from '../Directories';
import { androidNativeUnitTests } from './AndroidNativeUnitTests';

type PlatformName = 'android' | 'ios' | 'both';

async function thisAction({ platform }: { platform?: PlatformName }) {
  if (!platform) {
    console.log(chalk.yellow("You haven't specified platform to run unit tests for!"));
    const result = await inquirer.prompt<{ platform: PlatformName }>([
      {
        name: 'platform',
        type: 'list',
        message: 'Which platform do you want to run native tests ?',
        choices: ['android', 'ios', 'both'],
        default: 'android',
      },
    ]);
    platform = result.platform;
  }
  const runAndroid = platform === 'android' || platform === 'both';
  const runIos = platform === 'ios' || platform === 'both';
  if (runIos) {
    try {
      await spawnAsync('fastlane scan', undefined, {
        cwd: Directories.getIosDir(),
        stdio: 'inherit',
      });
    } catch (e) {
      console.log('Something went wrong:');
      console.log(e);
    }
  }

  if (runAndroid) {
    await androidNativeUnitTests();
  }
}

export default (program: any) => {
  program
    .command('native-unit-tests')
    .option(
      '-p --platform <string>',
      'Determine for which platform we should run native tests: android, ios or both'
    )
    .description('Runs native unit tests for each unimodules that provides them.')
    .asyncAction(thisAction);
};
