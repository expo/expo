import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';

import * as Directories from '../Directories';
import * as Packages from '../Packages';

const ANDROID_DIR = Directories.getAndroidDir();

const excludedInTests = [
  "expo-module-template",
  "expo-bluetooth",
  "expo-notifications",
  "expo-in-app-purchases",
  "expo-updates"
]

async function action() {
  const unimodules = await Packages.getListOfPackagesAsync();

  function consoleErrorOutput(output: string, label: string, color: (string) => string): void {
    const lines = output.trim().split(/\r\n?|\n/g);
    console.error(lines.map(line => `${chalk.gray(label)} ${color(line)}`).join('\n'));
  }

  let androidPackages: string[] = [];
  console.log(chalk.green('Unimodules to test: '));
  for (const pkg of unimodules) {
    const unimoduleName = pkg.unimoduleJson ? pkg.unimoduleJson.name : undefined;
    if(unimoduleName && pkg.isSupportedOnPlatform('android') && !excludedInTests.includes(unimoduleName)) {
      androidPackages = [...androidPackages, unimoduleName];
      console.log(chalk.yellow(unimoduleName));
    }
  }
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
    .description('Runs unit tests for unimodules supporting android.')
    .asyncAction(action);
};
