import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import path from 'path';

import * as Directories from '../Directories';
import * as Packages from '../Packages';

async function runTests(testTargets: string[]) {
  await spawnAsync('fastlane', ['ios', 'unit_tests', `targets:${testTargets.join(',')}`], {
    cwd: Directories.getExpoRepositoryRootDir(),
    stdio: 'inherit',
  });
}

function getTestSpecNames(pkg: Packages.Package): string[] {
  const podspec = fs.readFileSync(path.join(pkg.path, pkg.podspecPath!), 'utf8');
  const regex = new RegExp("test_spec\\s'([^']*)'", 'g');
  const testSpecNames: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(podspec)) !== null) {
    testSpecNames.push(match[1]);
  }
  return testSpecNames;
}

export async function iosNativeUnitTests({ packages }: { packages?: string }) {
  const allPackages = await Packages.getListOfPackagesAsync();
  const packageNamesFilter = packages ? packages.split(',') : [];

  const targetsToTest: string[] = [];
  const packagesToTest: string[] = [];
  for (const pkg of allPackages) {
    if (!pkg.podspecName || !pkg.podspecPath || !(await pkg.hasNativeTestsAsync('ios'))) {
      if (packageNamesFilter.includes(pkg.packageName)) {
        throw new Error(`The package ${pkg.packageName} does not include iOS unit tests.`);
      }
      continue;
    }

    if (packageNamesFilter.length > 0 && !packageNamesFilter.includes(pkg.packageName)) {
      continue;
    }

    const testSpecNames = getTestSpecNames(pkg);
    if (!testSpecNames.length) {
      throw new Error(
        `Failed to test package ${pkg.packageName}: no test specs were found in podspec file.`
      );
    }

    for (const testSpecName of testSpecNames) {
      targetsToTest.push(`${pkg.podspecName}-Unit-${testSpecName}`);
    }
    packagesToTest.push(pkg.packageName);
  }

  // @tsapeta: `expo-modules-core` has two podspecs – for the core and for the JSI. This is supported by autolinking,
  // but not by expotools and as a result only `ExpoModulesJSI` tests are being included. Here we make sure the tests
  // for the core are included. Long-term plan is to move JSI pod to a separate package, then this can be removed.
  if (packagesToTest.includes('expo-modules-core')) {
    targetsToTest.unshift(`ExpoModulesCore-Unit-Tests`);
  }

  if (packageNamesFilter.length && !targetsToTest.length) {
    throw new Error(
      `No packages were found with the specified names: ${packageNamesFilter.join(', ')}`
    );
  }

  try {
    console.log(`Running tests for targets:\n- ${targetsToTest.join('\n- ')}\n`);
    await runTests(targetsToTest);
  } catch (error) {
    console.error('iOS unit tests failed:');
    console.error('stdout >', error.stdout);
    console.error('stderr >', error.stderr);
    throw new Error('iOS Unit tests failed');
  }
  console.log('✅ All unit tests passed for the following packages:', packagesToTest.join(', '));
}

export default (program: any) => {
  program
    .command('ios-native-unit-tests')
    .option(
      '--packages <string>',
      '[optional] Comma-separated list of package names to run unit tests for. Defaults to all packages with unit tests.'
    )
    .description('Runs iOS native unit tests for each package that provides them.')
    .asyncAction(iosNativeUnitTests);
};
