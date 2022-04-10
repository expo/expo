import fs from 'fs-extra';
import glob from 'glob-promise';
import path from 'path';
import spawnAsync from '@expo/spawn-async';

import { ANDROID_DIR, PACKAGES_DIR, EXPOTOOLS_DIR } from '../../../Constants';
import { getListOfPackagesAsync, Package } from '../../../Packages';
import { transformFileAsync } from '../../../Transforms';

const CXX_EXPO_MODULE_PATCHES_DIR = path.join(
  EXPOTOOLS_DIR,
  'src',
  'versioning',
  'android',
  'versionCxx',
  'patches'
);

/**
 * Executes the versioning for expo-modules with cxx code.
 *
 * Currently, it is a patch based process.
 * we patch build files directly in `packages/{packageName}`,
 * build the share libraries in place and copy back to versioned jniLibs folder.
 * To add an module for versioning,
 * please adds a corresponding `tools/src/versioning/android/versionCxx/patches/{packageName}.patch` patch file.
 */
export async function versionCxxExpoModulesAsync(version: string) {
  const packages = await getListOfPackagesAsync();
  const versionablePackages = packages.filter((pkg) => isVersionableCxxExpoModule(pkg));

  await Promise.all(
    versionablePackages.map(async (pkg) => {
      const { packageName } = pkg;
      const abiName = `abi${version.replace(/\./g, '_')}`;
      const versionedAbiRoot = path.join(ANDROID_DIR, 'versioned-abis', `expoview-${abiName}`);

      // Applies versioning patches
      const patchFile = path.join(CXX_EXPO_MODULE_PATCHES_DIR, `${pkg.packageName}.patch`);
      const patchArgs = [
        patchFile,
        '|',
        'sed',
        '-e',
        `s/abi[0-9]*_[0-9]*_[0-9]*/${abiName}/g`,
        '|',
        'patch',
        '-p3',
      ];
      await spawnAsync('cat', patchArgs, {
        cwd: path.join(PACKAGES_DIR, packageName),
        shell: true,
      });

      // Builds shared libraries
      await spawnAsync('./gradlew', [`:${packageName}:copyReleaseJniLibsProjectOnly`], {
        cwd: ANDROID_DIR,
      });

      // Reverts versioning patches
      await spawnAsync('cat', [...patchArgs, '-R'], {
        cwd: path.join(PACKAGES_DIR, packageName),
        shell: true,
      });

      await copySoPrebuiltLibs(packageName, versionedAbiRoot);
      await versionJavaLoadersAsync(packageName, versionedAbiRoot, abiName);
    })
  );
}

/**
 * Returns true if the package is a versionable cxx module
 */
function isVersionableCxxExpoModule(pkg: Package) {
  return (
    pkg.isSupportedOnPlatform('android') &&
    pkg.isIncludedInExpoClientOnPlatform('android') &&
    pkg.isVersionableOnPlatform('android') &&
    fs.existsSync(path.join(CXX_EXPO_MODULE_PATCHES_DIR, `${pkg.packageName}.patch`))
  );
}

/**
 * Copies the generated shared libraries from build output to `android/versioned-abis/expoview-abiXX_0_0/src/main/jniLibs`
 */
async function copySoPrebuiltLibs(packageName: string, versionedAbiRoot: string) {
  const libRoot = path.join(
    PACKAGES_DIR,
    packageName,
    'android',
    'build',
    'intermediates',
    'library_jni',
    'release',
    'jni'
  );

  const jniLibsRoot = path.join(versionedAbiRoot, 'src', 'main', 'jniLibs');
  const libs = await glob('**/*.so', { cwd: libRoot });
  await Promise.all(
    libs.map((lib) => fs.copyFile(path.join(libRoot, lib), path.join(jniLibsRoot, lib)))
  );
}

/**
 * Transforms `System.loadLibrary("expoXXX")` to `System.loadLibrary("expoXXX_abiXX_0_0")` in java or kotlin files
 */
async function versionJavaLoadersAsync(
  packageName: string,
  versionedAbiRoot: string,
  abiName: string
) {
  const srcJavaRoot = path.join(PACKAGES_DIR, packageName, 'android', 'src', 'main', 'java');
  const srcJavaFiles = await glob('**/*.{java,kt}', { cwd: srcJavaRoot });
  const versionedJavaFiles = srcJavaFiles.map((file) =>
    path.join(versionedAbiRoot, 'src', 'main', 'java', abiName, file)
  );
  await Promise.all(
    versionedJavaFiles.map((file) =>
      transformFileAsync(file, [
        {
          find: new RegExp(`\\b(System\\.loadLibrary\\("expo.*)("\\);?)`, 'g'),
          replaceWith: `$1_${abiName}$2`,
        },
      ])
    )
  );
}
