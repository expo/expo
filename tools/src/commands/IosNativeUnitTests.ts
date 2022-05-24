import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import path from 'path';

import * as Directories from '../Directories';
import * as Packages from '../Packages';

const TEST_APP_IOS_DIR = path.join(Directories.getAppsDir(), 'native-tests', 'ios');

async function runTests(testTargets: string[]) {
  await spawnAsync('fastlane', ['ios', 'unit_tests', `targets:${testTargets.join(',')}`], {
    cwd: Directories.getExpoRepositoryRootDir(),
    stdio: 'inherit',
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function prepareSchemes(podspecName: string) {
  await spawnAsync(
    'fastlane',
    ['run', 'recreate_schemes', `project:Pods/${podspecName}.xcodeproj`],
    {
      cwd: TEST_APP_IOS_DIR,
      stdio: 'inherit',
    }
  );

  await moveSchemesToSharedData(podspecName, TEST_APP_IOS_DIR);
}

async function moveSchemesToSharedData(podspecName: string, rootDirectory: string) {
  // make schemes shared by moving them from xcodeproj/xcuserdata/runner.xcuserdatad/xcschemes
  // to xcodeproj/xcshareddata/xcschemes
  // otherwise they aren't visible to fastlane
  const xcodeprojDir = path.join(rootDirectory, 'Pods', `${podspecName}.xcodeproj`);
  const destinationDir = path.join(xcodeprojDir, 'xcshareddata', 'xcschemes');
  await fs.mkdirp(destinationDir);

  // find user directory name, should be runner.xcuserdatad but depends on the OS username
  const xcuserdataDirName = (await fs.readdir(path.join(xcodeprojDir, 'xcuserdata')))[0];

  const xcschemesDir = path.join(xcodeprojDir, 'xcuserdata', xcuserdataDirName, 'xcschemes');
  const xcschemesFiles = (await fs.readdir(xcschemesDir)).filter((file) =>
    file.endsWith('.xcscheme')
  );
  if (!xcschemesFiles.length) {
    throw new Error(`No scheme could be found to run tests for ${podspecName}`);
  }
  for (const file of xcschemesFiles) {
    await fs.move(path.join(xcschemesDir, file), path.join(destinationDir, file), {
      overwrite: true,
    });
  }
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
    // if no filters, don't need to iterate through packages,
    // test spec names will be inferred by fastlane action
    if (!packageNamesFilter.length) {
      break;
    }

    if (!packageNamesFilter.includes(pkg.packageName)) {
      continue;
    }

    if (!pkg.podspecName || !pkg.podspecPath || !(await pkg.hasNativeTestsAsync('ios'))) {
      if (packageNamesFilter.includes(pkg.packageName)) {
        throw new Error(`The package ${pkg.packageName} does not include iOS unit tests.`);
      }
      continue;
    }

    const testSpecNames = getTestSpecNames(pkg);
    if (!testSpecNames.length) {
      throw new Error(
        `Failed to test package ${pkg.packageName}: no test specs were found in podspec file.`
      );
    }

    console.log(pkg.podspecPath);
    // TODO: do we need this?
    // await prepareSchemes(pkg.podspecName);

    for (const testSpecName of testSpecNames) {
      targetsToTest.push(`${pkg.podspecName}-Unit-${testSpecName}`);
    }
  }

  if (packageNamesFilter.length && !targetsToTest.length) {
    throw new Error(
      `No packages were found with the specified names: ${packageNamesFilter.join(', ')}`
    );
  }

  try {
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
