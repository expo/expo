import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import path from 'path';

import * as Directories from '../Directories';
import * as Packages from '../Packages';
import { filterAsync } from '../Utils';

const ANDROID_DIR = Directories.getAndroidDir();

const BARE_EXPO_DIR = path.join(Directories.getAppsDir(), 'bare-expo', 'android');

const excludedInTests = [
  'expo-module-template',
  'expo-notifications',
  'expo-in-app-purchases',
  'expo-splash-screen',
  'expo-modules-test-core',
  'expo-dev-client',
];

const packagesNeedToBeTestedUsingBareExpo = [
  'expo-dev-menu',
  'expo-dev-launcher',
  'expo-dev-menu-interface',
];

type TestType = 'local' | 'instrumented';

function consoleErrorOutput(output: string, label: string, colorifyLine: (string) => string): void {
  const lines = output.trim().split(/\r\n?|\n/g);
  console.error(lines.map((line) => `${chalk.gray(label)} ${colorifyLine(line)}`).join('\n'));
}

export async function androidNativeUnitTests({
  type,
  packages,
}: {
  type: TestType;
  packages?: string;
}) {
  if (!type) {
    throw new Error(
      'Must specify which type of unit test to run with `--type local` or `--type instrumented`.'
    );
  }
  if (type !== 'local' && type !== 'instrumented') {
    throw new Error('Invalid type specified. Must use `--type local` or `--type instrumented`.');
  }

  const allPackages = await Packages.getListOfPackagesAsync();
  const packageNamesFilter = packages ? packages.split(',') : [];

  const androidPackages = await filterAsync(allPackages, async (pkg) => {
    const pkgSlug = pkg.packageSlug;

    if (packageNamesFilter.length > 0 && !packageNamesFilter.includes(pkg.packageName)) {
      return false;
    }

    let includesTests;
    if (type === 'instrumented') {
      includesTests =
        pkg.isSupportedOnPlatform('android') &&
        (await pkg.hasNativeInstrumentationTestsAsync('android')) &&
        !excludedInTests.includes(pkgSlug);
    } else {
      includesTests =
        pkg.isSupportedOnPlatform('android') &&
        (await pkg.hasNativeTestsAsync('android')) &&
        !excludedInTests.includes(pkgSlug);
    }

    if (!includesTests && packageNamesFilter.includes(pkg.packageName)) {
      throw new Error(
        `The package ${pkg.packageName} does not include Android ${type} unit tests.`
      );
    }

    return includesTests;
  });

  console.log(chalk.green('Packages to test: '));
  androidPackages.forEach((pkg) => {
    console.log(chalk.yellow(pkg.packageSlug));
  });

  const testCommand = type === 'instrumented' ? 'connectedAndroidTest' : 'testDebugUnitTest';

  const partition = <T>(arr: T[], condition: (T) => boolean) => {
    const trues = arr.filter((el) => condition(el));
    const falses = arr.filter((el) => !condition(el));
    return [trues, falses];
  };

  const [
    androidPackagesTestedUsingBareProject,
    androidPackagesTestedUsingExpoProject,
  ] = partition(androidPackages, (element) =>
    packagesNeedToBeTestedUsingBareExpo.includes(element.packageName)
  );

  await runGradlew(androidPackagesTestedUsingExpoProject, testCommand, ANDROID_DIR);
  await runGradlew(androidPackagesTestedUsingBareProject, testCommand, BARE_EXPO_DIR);
  console.log(chalk.green('Finished android unit tests successfully.'));
}

async function runGradlew(packages: Packages.Package[], testCommand: string, cwd: string) {
  if (!packages.length) {
    return;
  }

  try {
    await spawnAsync(
      './gradlew',
      packages.map((pkg) => `:${pkg.packageSlug}:${testCommand}`),
      {
        cwd,
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
}

export default (program: any) => {
  program
    .command('android-native-unit-tests')
    .option('-t, --type <string>', 'Type of unit test to run: local or instrumented')
    .option(
      '--packages <string>',
      '[optional] Comma-separated list of package names to run unit tests for. Defaults to all packages with unit tests.'
    )
    .description('Runs Android native unit tests for each package that provides them.')
    .asyncAction(androidNativeUnitTests);
};
