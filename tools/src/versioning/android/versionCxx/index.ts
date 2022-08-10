import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import glob from 'glob-promise';
import path from 'path';

import { ANDROID_DIR, PACKAGES_DIR, EXPOTOOLS_DIR } from '../../../Constants';
import { getListOfPackagesAsync, Package } from '../../../Packages';
import { transformFileAsync, transformString } from '../../../Transforms';
import { applyPatchAsync } from '../../../Utils';

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

  for (const pkg of versionablePackages) {
    const { packageName } = pkg;
    const abiName = `abi${version.replace(/\./g, '_')}`;
    const versionedAbiRoot = path.join(ANDROID_DIR, 'versioned-abis', `expoview-${abiName}`);

    const patchContent = await getTransformPatchContentAsync(packageName, abiName);

    await applyPatchForPackageAsync(packageName, patchContent);
    await buildSoLibsAsync(packageName);
    await revertPatchForPackageAsync(packageName, patchContent);

    await copyPrebuiltSoLibsAsync(packageName, versionedAbiRoot);
    await versionJavaLoadersAsync(packageName, versionedAbiRoot, abiName);

    console.log(`   ✅  Created versioned c++ libraries for ${packageName}`);
  }
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
 * Applies versioning patch for building shared libraries
 */
export function applyPatchForPackageAsync(packageName: string, patchContent: string) {
  return applyPatchAsync({
    patchContent,
    reverse: false,
    cwd: path.join(PACKAGES_DIR, packageName),
    stripPrefixNum: 3,
  });
}

/**
 * Reverts versioning patch for building shared libraries
 */
export function revertPatchForPackageAsync(packageName: string, patchContent: string) {
  return applyPatchAsync({
    patchContent,
    reverse: true,
    cwd: path.join(PACKAGES_DIR, packageName),
    stripPrefixNum: 3,
  });
}

/**
 * Builds shared libraries
 */
async function buildSoLibsAsync(packageName: string) {
  await spawnAsync('./gradlew', [`:${packageName}:copyReleaseJniLibsProjectAndLocalJars`], {
    cwd: ANDROID_DIR,
  });
}

/**
 * Copies the generated shared libraries from build output to `android/versioned-abis/expoview-abiXX_0_0/src/main/jniLibs`
 */
async function copyPrebuiltSoLibsAsync(packageName: string, versionedAbiRoot: string) {
  const libRoot = path.join(
    PACKAGES_DIR,
    packageName,
    'android',
    'build',
    'intermediates',
    'stripped_native_libs',
    'release',
    'out',
    'lib'
  );

  const jniLibsRoot = path.join(versionedAbiRoot, 'src', 'main', 'jniLibs');
  const libs = await glob('**/libexpo*.so', { cwd: libRoot });
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
    versionedJavaFiles.map(async (file) => {
      if (await fs.pathExists(file)) {
        await transformFileAsync(file, [
          {
            find: /\b((System|SoLoader)\.loadLibrary\("expo[^"]*)("\);?)/g,
            replaceWith: `$1_${abiName}$3`,
          },
        ]);
      }
    })
  );
}

/**
 * Read the patch content and do `abiName` transformation
 */
async function getTransformPatchContentAsync(packageName: string, abiName: string) {
  const patchFile = path.join(CXX_EXPO_MODULE_PATCHES_DIR, `${packageName}.patch`);
  let content = await fs.readFile(patchFile, 'utf8');
  content = await transformString(content, [
    {
      find: /\{VERSIONED_ABI_NAME\}/g,
      replaceWith: abiName,
    },
    {
      find: /\{VERSIONED_ABI_NAME_JNI_ESCAPED\}/g,
      replaceWith: escapeJniSymbol(abiName),
    },
  ]);
  return content;
}

/**
 * Escapes special characters for java symbol -> cpp symbol mapping
 * Reference: https://docs.oracle.com/en/java/javase/17/docs/specs/jni/design.html#resolving-native-method-names
 * UTF-16 codes are not supported
 */
function escapeJniSymbol(symbol) {
  const mappings = {
    '/': '_',
    _: '_1',
    ';': '_2',
    '[': '_3',
  };
  return symbol.replace(/[/_;\[]/g, (match) => mappings[match]);
}
