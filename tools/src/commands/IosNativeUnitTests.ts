import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import path from 'path';

import * as Directories from '../Directories';
import * as Packages from '../Packages';

const BARE_EXPO_IOS_DIR = path.join(Directories.getAppsDir(), 'bare-expo', 'ios');
const packagesToTestWithBareExpo = [
  'expo-dev-client',
  'expo-dev-launcher',
  'expo-dev-menu',
  'expo-dev-menu-interface',
];

async function runTests(podspecName: string, testSpecName: string, shouldUseBareExpo: boolean) {
  if (shouldUseBareExpo) {
    await spawnAsync(
      'fastlane',
      [
        'scan',
        '--project',
        `Pods/${podspecName}.xcodeproj`,
        '--scheme',
        `${podspecName}-Unit-${testSpecName}`,
        '--clean',
        'false',
      ],
      {
        cwd: BARE_EXPO_IOS_DIR,
        stdio: 'inherit',
      }
    );
  } else {
    await spawnAsync(
      'fastlane',
      ['test_module', `pod:${podspecName}`, `testSpecName:${testSpecName}`],
      {
        cwd: Directories.getExpoRepositoryRootDir(),
        stdio: 'inherit',
      }
    );
  }
}

async function prepareSchemes(podspecName: string, shouldUseBareExpo: boolean) {
  if (shouldUseBareExpo) {
    await spawnAsync(
      'fastlane',
      ['run', 'recreate_schemes', `project:Pods/${podspecName}.xcodeproj`],
      {
        cwd: BARE_EXPO_IOS_DIR,
        stdio: 'inherit',
      }
    );
  } else {
    await spawnAsync('fastlane', ['prepare_schemes', `pod:${podspecName}`], {
      cwd: Directories.getExpoRepositoryRootDir(),
      stdio: 'inherit',
    });
  }

  await moveSchemesToSharedData(
    podspecName,
    shouldUseBareExpo ? BARE_EXPO_IOS_DIR : Directories.getIosDir()
  );
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
  let testSpecNames: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(podspec)) !== null) {
    testSpecNames.push(match[1]);
  }
  return testSpecNames;
}

export async function iosNativeUnitTests({ packages }: { packages?: string }) {
  const allPackages = await Packages.getListOfPackagesAsync();
  const packageNamesFilter = packages ? packages.split(',') : [];
  let packagesTested: string[] = [];
  let errors: any[] = [];
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
    const shouldUseBareExpo = packagesToTestWithBareExpo.includes(pkg.packageName);

    try {
      await prepareSchemes(pkg.podspecName, shouldUseBareExpo);
      const testSpecNames = getTestSpecNames(pkg);
      if (!testSpecNames.length) {
        throw new Error(
          `Failed to test package ${pkg.packageName}: no test specs were found in podspec file.`
        );
      }
      for (const testSpecName of testSpecNames) {
        await runTests(pkg.podspecName, testSpecName, shouldUseBareExpo);
      }
      packagesTested.push(pkg.packageName);
    } catch (error) {
      errors.push({ error, packageName: pkg.packageName });
    }
  }
  if (errors.length) {
    console.error('One or more iOS unit tests failed:');
    for (const { error, packageName } of errors) {
      console.error(`Error running tests for ${packageName}: ${error.message}`);
      console.error('stdout >', error.stdout);
      console.error('stderr >', error.stderr);
      if (error.message.startsWith('fastlane exited')) {
        console.warn(
          "Did you add unit tests to a package that didn't have unit tests before? If so, make sure to add the correct subspec to ios/Podfile."
        );
      }
    }
    throw new Error('Unit tests failed');
  } else {
    console.log('✅ All unit tests passed for the following packages:', packagesTested.join(', '));
  }
}

export default (program: any) => {
  program
    .command('ios-native-unit-tests')
    .option(
      '--packages <string>',
      '[optional] Comma-separated list of package names to run unit tests for. Defaults to all packages with unit tests.'
    )
    .description('Runs iOS native unit tests for each package that provides them.')
    .action(iosNativeUnitTests);
};
