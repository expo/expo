import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import path from 'path';

import * as Directories from '../Directories';
import * as Packages from '../Packages';
import { filterAsync } from '../Utils';

const BARE_EXPO_DIR = path.join(Directories.getAppsDir(), 'bare-expo', 'android');

const excludedInTests = [
  'expo-module-template',
  'expo-module-template-local',
  'expo-splash-screen',
  'expo-modules-test-core',
  'expo-dev-client',
  'expo-dev-launcher',
];

const testTypes = ['local', 'instrumented', 'spotless'] as const;
const testTypeSet = new Set(testTypes);
type TestType = (typeof testTypes)[number];

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
      `Must specify which type of unit test to run. type must be one of ${testTypes.join(',')}`
    );
  }
  if (!testTypeSet.has(type)) {
    throw new Error(`Invalid type specified. type must be one of ${testTypes.join(',')}`);
  }

  const allPackages = await Packages.getListOfPackagesAsync();
  const packageNamesFilter = packages ? packages.split(',') : [];

  const androidPackages = await filterAsync(allPackages, async (pkg) => {
    if (packageNamesFilter.length > 0 && !packageNamesFilter.includes(pkg.packageName)) {
      return false;
    }

    let includesTests: boolean = false;
    if (pkg.isSupportedOnPlatform('android') && !excludedInTests.includes(pkg.packageSlug)) {
      if (type === 'instrumented') {
        includesTests = await pkg.hasNativeInstrumentationTestsAsync('android');
      } else {
        includesTests = await pkg.hasNativeTestsAsync('android');
      }
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

  if (type === 'instrumented') {
    const testCommand = 'connectedAndroidTest';
    const uninstallTestCommand = 'uninstallDebugAndroidTest';

    // TODO: remove this once avd cache saved to storage
    await runGradlew(androidPackages, uninstallTestCommand, BARE_EXPO_DIR);

    // We should build and test expo-modules-core first
    // that to make the `isExpoModulesCoreTests` in _expo-modules-core/android/build.gradle_ working.
    // Otherwise, the `./gradlew :expo-modules-core:connectedAndroidTest :expo-eas-client:connectedAndroidTest`
    // will have duplicated fbjni.so when building expo-eas-client.
    const isExpoModulesCore = (pkg: Packages.Package) => pkg.packageName === 'expo-modules-core';
    const isNotExpoModulesCore = (pkg: Packages.Package) => pkg.packageName !== 'expo-modules-core';

    await runGradlew(androidPackages.filter(isExpoModulesCore), testCommand, BARE_EXPO_DIR);

    await runGradlew(androidPackages.filter(isNotExpoModulesCore), testCommand, BARE_EXPO_DIR);

    // Cleanup installed test app
    await runGradlew(androidPackages, uninstallTestCommand, BARE_EXPO_DIR);
  } else if (type === 'spotless') {
    const spotlessApplyCommand = 'spotlessApply';
    const spotlessCheckCommand = 'spotlessCheck';
    try {
      console.log(chalk.green('Running spotlessCheck...'));
      await runGradlew(androidPackages, spotlessCheckCommand, BARE_EXPO_DIR);
      console.log(chalk.green('spotlessCheck succeeded'));
    } catch (e: any) {
      console.log(
        chalk.yellow(`spotlessCheck failed: ${e}. Attempting to fix with spotlessApply...`)
      );
      await runGradlew(androidPackages, spotlessApplyCommand, BARE_EXPO_DIR);
      chalk.green('spotlessApply succeeded');
    }
  } else {
    const testCommand = 'testDebugUnitTest';
    await runGradlew(androidPackages, testCommand, BARE_EXPO_DIR);
  }

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
    .option('-t, --type <string>', 'Type of unit test to run: local, instrumented, or spotless')
    .option(
      '--packages <string>',
      '[optional] Comma-separated list of package names to run unit tests for. Defaults to all packages with unit tests.'
    )
    .description('Runs Android native unit tests for each package that provides them.')
    .asyncAction(androidNativeUnitTests);
};
