import { Command } from '@expo/commander';
import JsonFile from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';
import assert from 'assert';
import fs from 'fs-extra';
import path from 'path';

import { EXPO_DIR, EXPOTOOLS_DIR } from '../Constants';
import logger from '../Logger';
import { getPackageViewAsync } from '../Npm';
import { transformFileAsync } from '../Transforms';
import { applyPatchAsync } from '../Utils';
import { installAsync as workspaceInstallAsync } from '../Workspace';

const PATCHES_ROOT = path.join(EXPOTOOLS_DIR, 'src', 'react-native-nightlies', 'patches');

export default (program: Command) => {
  program
    .command('setup-react-native-nightly')
    .description('Setup expo/expo monorepo to install react-native nightly build for testing')
    .asyncAction(main);
};

async function main() {
  const nightlyVersion = (await getPackageViewAsync('react-native'))?.['dist-tags'].nightly;
  if (!nightlyVersion) {
    throw new Error('Unable to get react-native nightly version.');
  }

  logger.info('Adding bare-expo optional packages:');
  await addBareExpoOptionalPackagesAsync();

  logger.info('Adding pinned packages:');
  const pinnedPackages = {
    'react-native': nightlyVersion,
  };
  await addPinnedPackagesAsync(pinnedPackages);

  logger.info('Yarning...');
  await workspaceInstallAsync();

  await patchAndroidTurboModuleAsync();
  // await patchAndroidBuildConfigAsync();
  // await patchSafeAreaContextAsync();

  logger.info('Setting up Expo modules files');
  await updateExpoModulesAsync();

  logger.info('Setting up project files for bare-expo.');
  await updateBareExpoAsync(nightlyVersion);
}

/**
 * To save the CI build time, some third-party libraries are intentionally not listed as dependencies in bare-expo.
 * Adding these packages for nightly testing to increase coverage.
 */
async function addBareExpoOptionalPackagesAsync() {
  const bareExpoRoot = path.join(EXPO_DIR, 'apps', 'bare-expo');
  const OPTIONAL_PKGS = ['@shopify/react-native-skia', 'lottie-react-native', 'react-native-maps'];

  const packageJsonNCL = await JsonFile.readAsync(
    path.join(EXPO_DIR, 'apps', 'native-component-list', 'package.json')
  );
  const versionMap = {
    ...(packageJsonNCL.devDependencies as object),
    ...(packageJsonNCL.dependencies as object),
  };

  const installPackages = OPTIONAL_PKGS.map((pkg) => {
    const version = versionMap[pkg];
    assert(version);
    return `${pkg}@${version}`;
  });
  for (const pkg of installPackages) {
    logger.log('  ', pkg);
  }

  await spawnAsync('yarn', ['add', ...installPackages], { cwd: bareExpoRoot });
}

async function addPinnedPackagesAsync(packages: Record<string, string>) {
  const workspacePackageJsonPath = path.join(EXPO_DIR, 'package.json');
  const json = await JsonFile.readAsync(workspacePackageJsonPath);
  json.resolutions ||= {};
  for (const [name, version] of Object.entries(packages)) {
    logger.log('  ', `${name}@${version}`);
    json.resolutions[name] = version;
  }
  await JsonFile.writeAsync(workspacePackageJsonPath, json);
}

async function patchAndroidTurboModuleAsync() {
  const nodeModulesDir = path.join(EXPO_DIR, 'node_modules');
  const targetFiles = [
    path.join(
      nodeModulesDir,
      'react-native-reanimated',
      'android/src/paper/java/com/swmansion/reanimated/NativeProxy.java'
    ),
    path.join(
      nodeModulesDir,
      'react-native-reanimated',
      'android/src/fabric/java/com/swmansion/reanimated/NativeProxy.java'
    ),
    path.join(
      nodeModulesDir,
      '@shopify/react-native-skia',
      'android/src/main/java/com/shopify/reactnative/skia/SkiaManager.java'
    ),
  ];

  for (const file of targetFiles) {
    await transformFileAsync(file, [
      {
        find: `import com.facebook.react.turbomodule.core.CallInvokerHolderImpl;`,
        replaceWith: 'import com.facebook.react.internal.turbomodule.core.CallInvokerHolderImpl;',
      },
    ]);
  }
}

async function patchSafeAreaContextAsync() {
  const patchFile = path.join(PATCHES_ROOT, 'react-native-safe-area-context.patch');
  const patchContent = await fs.readFile(patchFile, 'utf8');
  await applyPatchAsync({ patchContent, cwd: EXPO_DIR, stripPrefixNum: 1 });
}

async function updateExpoModulesAsync() {
  // no-op currently
}

async function updateBareExpoAsync(nightlyVersion: string) {
  const root = path.join(EXPO_DIR, 'apps', 'bare-expo');

  // Flipper was removed in 0.74
  await transformFileAsync(path.join(root, 'ios', 'Podfile'), [
    {
      find: `flipper_config = ENV['NO_FLIPPER'] == "1" || ENV['CI'] ? FlipperConfiguration.disabled : FlipperConfiguration.enabled`,
      replaceWith: '',
    },
    {
      find: /:flipper_configuration => FlipperConfiguration.disabled,/g,
      replaceWith: '',
    },
  ]);
  await transformFileAsync(path.join(root, 'android', 'app', 'build.gradle'), [
    {
      find: `implementation("com.facebook.react:flipper-integration")`,
      replaceWith: '',
    },
  ]);
}

async function patchAndroidBuildConfigAsync() {
  const missingBuildConfigModules = [
    '@react-native-async-storage/async-storage',
    '@react-native-community/datetimepicker',
    '@react-native-community/netinfo',
    '@react-native-community/slider',
    'lottie-react-native',
    'react-native-gesture-handler',
    'react-native-maps',
    'react-native-pager-view',
    'react-native-reanimated',
    'react-native-safe-area-context',
    'react-native-screens',
    'react-native-svg',
    'react-native-webview',
  ];
  const searchPattern = /^(android \{[\s\S]*?)(\n})/gm;
  const replacement = `$1
    buildFeatures {
        buildConfig true
    }$2`;
  for (const module of missingBuildConfigModules) {
    const gradleFile = path.join(EXPO_DIR, 'node_modules', module, 'android', 'build.gradle');
    await transformFileAsync(gradleFile, [
      {
        find: searchPattern,
        replaceWith: replacement,
      },
    ]);
  }
}
