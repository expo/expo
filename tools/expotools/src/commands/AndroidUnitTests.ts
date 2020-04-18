import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';

import * as Directories from '../Directories';
import * as Packages from '../Packages';

const ANDROID_DIR = Directories.getAndroidDir();

const excludedInTests = [
  'expo-module-template',
  'expo-bluetooth',
  'expo-notifications',
  'expo-in-app-purchases',
  'expo-splash-screen',
  'expo-updates'
]

async function action() {
  const unimodules = await Packages.getListOfPackagesAsync();

  function consoleErrorOutput(output: string, label: string, colorifyLine: (string) => string): void {
    const lines = output.trim().split(/\r\n?|\n/g);
    console.error(lines.map(line => `${chalk.gray(label)} ${colorifyLine(line)}`).join('\n'));
  }

  let androidPackages = unimodules.filter(unimodule => {
    const unimoduleName = unimodule?.unimoduleJson?.name;
    return unimoduleName && unimodule.isSupportedOnPlatform('android') && !excludedInTests.includes(unimoduleName)
  }).map(unimodule => unimodule?.unimoduleJson?.name);

  console.log(chalk.green('Unimodules to test: '));
  androidPackages.forEach(unimoduleName => {
    console.log(chalk.yellow(unimoduleName))
  });

  try {
    await spawnAsync('./gradlew', androidPackages.map(it => `:${it}:test`), {
      cwd: ANDROID_DIR,
      stdio: 'inherit',
      env: { ...process.env },
    });
  } catch (error) {
    console.error('Failed while executing android unit tests')
    consoleErrorOutput(error.stdout, 'stdout >', chalk.reset);
    consoleErrorOutput(error.stderr, 'stderr >', chalk.red);
    throw error;
  }
  console.log(chalk.green('Finished android unit tests successfully.'))
  return;
}

export default (program: any) => {
  program
    .command('android-unit-tests')
    .description('Runs Android native unit tests for each unimodules that provides them.')
    .asyncAction(action);
};
