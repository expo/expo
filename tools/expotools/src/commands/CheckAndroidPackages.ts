import fs from 'fs-extra';
import path from 'path';

import * as Directories from '../Directories';
import * as Packages from '../Packages';

const EXPO_ROOT_DIR = Directories.getExpoRepositoryRootDir();
const ANDROID_DIR = Directories.getAndroidDir();

async function _getOutdatedUnimodules(packages: Packages.Package[]): Promise<string[]> {
  const outdatedPackages: string[] = [];
  for (const pkg of packages) {
    if (
      !pkg.isSupportedOnPlatform('android') ||
      !pkg.androidPackageName ||
      pkg.packageSlug === 'expo-module-template'
    )
      continue;
    const buildDir = `${pkg.androidPackageName.replace(/\./g, '/')}/${pkg.packageSlug}`;
    const version = pkg.packageVersion;
    if (
      !(await fs.pathExists(
        path.join(EXPO_ROOT_DIR, 'expokit-npm-package', 'maven', buildDir, version)
      ))
    ) {
      outdatedPackages.push(pkg.packageSlug);
    }
  }
  return outdatedPackages;
}

async function action() {
  const unimodules = await Packages.getListOfPackagesAsync();

  const expoviewBuildGradle = await fs.readFile(path.join(ANDROID_DIR, 'expoview', 'build.gradle'));
  const match = expoviewBuildGradle
    .toString()
    .match(/api 'com.facebook.react:react-native:([\d.]+)'/);
  if (!match || !match[1]) {
    throw new Error(
      'Could not find SDK version in android/expoview/build.gradle: unexpected format'
    );
  }
  const sdkVersion = match[1];

  const outdatedPackages = await _getOutdatedUnimodules(unimodules);

  const reactNativePath = path.join(
    EXPO_ROOT_DIR,
    'expokit-npm-package',
    'maven',
    'com',
    'facebook',
    'react',
    'react-native',
    sdkVersion
  );
  const expoviewPath = path.join(
    EXPO_ROOT_DIR,
    'expokit-npm-package',
    'maven',
    'host',
    'exp',
    'exponent',
    'expoview',
    sdkVersion
  );
  if (!(await fs.pathExists(reactNativePath))) {
    outdatedPackages.push('ReactAndroid');
  }
  if (!(await fs.pathExists(expoviewPath))) {
    outdatedPackages.push('expoview');
  }

  if (outdatedPackages.length > 0) {
    console.log('Outdated packages:', outdatedPackages);
    throw new Error(
      `Packages are out of date. Rerun \`et check-android-packages --sdkVersion ${match[1]} --packages suggested\` and commit the changes.`
    );
  } else {
    console.log('All packages are up-to-date!');
  }
}

export default (program: any) => {
  program
    .command('check-android-packages')
    .description('Checks that all Android AAR package versions for ExpoKit are up-to-date')
    .asyncAction(action);
};
