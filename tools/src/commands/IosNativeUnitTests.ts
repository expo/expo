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

// Computes the Xcode unit-test target names for a package by scanning every podspec it
// declares — a package like expo-modules-core ships several (ExpoModulesCore,
// ExpoModulesWorklets, …), each potentially with its own test specs. Each test spec becomes
// `<PodName>-Unit-<TestSpecName>`, named after the podspec that owns it (not the package's
// primary podspec), which is how CocoaPods generates the targets.
function getUnitTestTargets(pkg: Packages.Package): string[] {
  const targets: string[] = [];
  for (const podspecRelPath of pkg.podspecPaths) {
    const podspecAbsPath = path.join(pkg.path, podspecRelPath);
    if (!fs.existsSync(podspecAbsPath)) {
      continue;
    }
    const podName = path.basename(podspecRelPath, '.podspec');
    const contents = fs.readFileSync(podspecAbsPath, 'utf8');
    for (const match of contents.matchAll(/test_spec\s'([^']*)'/g)) {
      targets.push(`${podName}-Unit-${match[1]}`);
    }
  }
  return targets;
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

    const pkgTargets = getUnitTestTargets(pkg);
    if (!pkgTargets.length) {
      throw new Error(
        `Failed to test package ${pkg.packageName}: no test specs were found in its podspec file(s).`
      );
    }

    targetsToTest.push(...pkgTargets);
    packagesToTest.push(pkg.packageName);
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
