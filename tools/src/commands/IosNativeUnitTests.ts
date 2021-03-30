import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import path from 'path';

import * as Directories from '../Directories';
import * as Packages from '../Packages';

export async function iosNativeUnitTests() {
  const packages = await Packages.getListOfPackagesAsync();
  let packagesTested: string[] = [];
  let errors: any[] = [];
  for (const pkg of packages) {
    if (
      !pkg.isSupportedOnPlatform('ios') ||
      !(await pkg.hasNativeTestsAsync('ios')) ||
      !pkg.podspecName
    ) {
      continue;
    }
    packagesTested.push(pkg.packageName);

    try {
      await spawnAsync('fastlane', ['prepare_schemes', `pod:${pkg.podspecName}`], {
        cwd: Directories.getExpoRepositoryRootDir(),
        stdio: 'inherit',
      });

      // make schemes shared by moving them from xcodeproj/xcuserdata/runner.xcuserdatad/xcschemes
      // to xcodeproj/xcshareddata/xcschemes
      // otherwise they aren't visible to fastlane
      const xcodeprojDir = path.join(
        Directories.getIosDir(),
        'Pods',
        `${pkg.podspecName}.xcodeproj`
      );
      const destinationDir = path.join(xcodeprojDir, 'xcshareddata', 'xcschemes');
      await fs.mkdirp(destinationDir);

      // find user directory name, should be runner.xcuserdatad but depends on the OS username
      const xcuserdataDirName = (await fs.readdir(path.join(xcodeprojDir, 'xcuserdata')))[0];

      const xcschemesDir = path.join(xcodeprojDir, 'xcuserdata', xcuserdataDirName, 'xcschemes');
      const xcschemesFiles = (await fs.readdir(xcschemesDir)).filter((file) =>
        file.endsWith('.xcscheme')
      );
      if (!xcschemesFiles.length) {
        throw new Error(`No scheme could be found to run tests for ${pkg.podspecName}`);
      }
      for (const file of xcschemesFiles) {
        await fs.move(path.join(xcschemesDir, file), path.join(destinationDir, file), {
          overwrite: true,
        });
      }

      await spawnAsync('fastlane', ['test_module', `pod:${pkg.podspecName}`], {
        cwd: Directories.getExpoRepositoryRootDir(),
        stdio: 'inherit',
      });
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length) {
    console.error('One or more iOS unit tests failed:');
    for (const error of errors) {
      console.error(error.message);
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
    .description('Runs iOS native unit tests for each package that provides them.')
    .asyncAction(iosNativeUnitTests);
};
