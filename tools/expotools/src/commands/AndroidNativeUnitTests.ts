import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';

import { filterAsync } from '../Utils';
import * as Directories from '../Directories';
import * as Packages from '../Packages';

const ANDROID_DIR = Directories.getAndroidDir();

const excludedInTests = [
  'expo-module-template',
  'expo-notifications',
  'expo-in-app-purchases',
  'expo-splash-screen',
  'unimodules-test-core',
];

type TestType = 'local' | 'instrumented';

export async function androidNativeUnitTests({ type }: { type: TestType }) {
  if (!type) {
    throw new Error(
      'Must specify which type of unit test to run with `--type local` or `--type instrumented`.'
    );
  }
  if (type !== 'local' && type !== 'instrumented') {
    throw new Error('Invalid type specified. Must use `--type local` or `--type instrumented`.');
  }

  const packages = await Packages.getListOfPackagesAsync();

  function consoleErrorOutput(
    output: string,
    label: string,
    colorifyLine: (string) => string
  ): void {
    const lines = output.trim().split(/\r\n?|\n/g);
    console.error(lines.map((line) => `${chalk.gray(label)} ${colorifyLine(line)}`).join('\n'));
  }

  const androidPackages = await filterAsync(packages, async (pkg) => {
    const pkgSlug = pkg.packageSlug;

    if (type === 'instrumented') {
      return (
        pkg.isSupportedOnPlatform('android') &&
        (await pkg.hasNativeInstrumentationTestsAsync('android')) &&
        !excludedInTests.includes(pkgSlug)
      );
    } else {
      return (
        pkg.isSupportedOnPlatform('android') &&
        (await pkg.hasNativeTestsAsync('android')) &&
        !excludedInTests.includes(pkgSlug)
      );
    }
  });

  console.log(chalk.green('Packages to test: '));
  androidPackages.forEach((pkg) => {
    console.log(chalk.yellow(pkg.packageSlug));
  });

  const testCommand = type === 'instrumented' ? 'connectedAndroidTest' : 'test';
  try {
    await spawnAsync(
      './gradlew',
      androidPackages.map((pkg) => `:${pkg.packageSlug}:${testCommand}`),
      {
        cwd: ANDROID_DIR,
        stdio: 'inherit',
        env: { ...process.env },
      }
    );
  } catch (error) {
    console.error('Failed while executing android unit tests');
    consoleErrorOutput(error.stdout, 'stdout >', chalk.reset);
    consoleErrorOutput(error.stderr, 'stderr >', chalk.red);
    throw error;
  }
  console.log(chalk.green('Finished android unit tests successfully.'));
  return;
}

export default (program: any) => {
  program
    .command('android-native-unit-tests')
    .option('-t, --type <string>', 'Type of unit test to run: local or instrumented')
    .description('Runs Android native unit tests for each package that provides them.')
    .asyncAction(androidNativeUnitTests);
};
