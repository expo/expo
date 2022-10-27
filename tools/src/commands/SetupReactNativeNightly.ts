import { Command } from '@expo/commander';
import JsonFile from '@expo/json-file';
import fs from 'fs-extra';
import path from 'path';

import { EXPO_DIR } from '../Constants';
import logger from '../Logger';
import { getPackageViewAsync } from '../Npm';
import { transformFileAsync } from '../Transforms';
import { installAsync as workspaceInstallAsync } from '../Workspace';

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

  logger.info('Adding pinned packages:');
  const pinnedPackages = {
    'react-native': nightlyVersion,
  };
  await addPinnedPackagesAsync(pinnedPackages);

  logger.info('Yarning...');
  await workspaceInstallAsync();

  await updateReactNativePackageAsync();

  await patchReanimatedAsync();

  logger.info('Setting up project files for bare-expo.');
  await updateBareExpoAsync();
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

async function updateReactNativePackageAsync() {
  const root = path.join(EXPO_DIR, 'node_modules', 'react-native');

  // Third party libraries used to use react-native minor version, update the version 9999.9999.9999 as the latest version
  await transformFileAsync(path.join(root, 'package.json'), [
    {
      find: '"version": "0.0.0-',
      replaceWith: '"version": "9999.9999.9999-',
    },
  ]);
  await transformFileAsync(path.join(root, 'ReactAndroid', 'gradle.properties'), [
    {
      find: 'VERSION_NAME=0.0.0-',
      replaceWith: 'VERSION_NAME=9999.9999.9999-',
    },
  ]);

  // Build hermes source from the main branch
  await fs.writeFile(path.join(root, 'sdks', '.hermesversion'), 'main');
  await transformFileAsync(path.join(root, 'sdks', 'hermes-engine', 'hermes-engine.podspec'), [
    {
      // Because we changed the version in package.json, the `isNightly` check in hermes-engine.podspec is broken
      find: "isNightly = version.start_with?('0.0.0-')",
      replaceWith: 'isNightly = true',
    },
  ]);

  // Remove unused hermes build artifacts to reduce build time
  await transformFileAsync(path.join(root, 'sdks', 'hermes-engine', 'hermes-engine.podspec'), [
    {
      find: './utils/build-mac-framework.sh',
      replaceWith: '',
    },
  ]);
  await transformFileAsync(
    path.join(root, 'sdks', 'hermes-engine', 'utils', 'build-ios-framework.sh'),
    [
      {
        find: 'build_apple_framework "iphoneos" "arm64" "$ios_deployment_target"',
        replaceWith: '',
      },
      {
        find: 'build_apple_framework "catalyst" "x86_64;arm64" "$ios_deployment_target"',
        replaceWith: '',
      },
      {
        find: 'create_universal_framework "iphoneos" "iphonesimulator" "catalyst"',
        replaceWith: 'create_universal_framework "iphonesimulator"',
      },
    ]
  );
}

async function patchReanimatedAsync() {
  // Workaround for reanimated doesn't support the hermes where building from source
  const root = path.join(EXPO_DIR, 'node_modules', 'react-native-reanimated');
  await transformFileAsync(path.join(root, 'android', 'build.gradle'), [
    {
      find: /\bdef hermesAAR = file\(.+\)/g,
      replaceWith:
        'def hermesAAR = file("$reactNative/ReactAndroid/hermes-engine/build/outputs/aar/hermes-engine-debug.aar")',
    },
  ]);

  // Remove this after reanimated support react-native 0.71
  await transformFileAsync(path.join(root, 'android', 'CMakeLists.txt'), [
    {
      find: /(\s*"\$\{NODE_MODULES_DIR\}\/react-native\/ReactAndroid\/src\/main\/jni")/g,
      replaceWith:
        '$1\n        "${NODE_MODULES_DIR}/react-native/ReactAndroid/src/main/jni/react/turbomodule"',
    },
  ]);
}

async function updateBareExpoAsync() {
  const gradlePropsFile = path.join(EXPO_DIR, 'apps', 'bare-expo', 'android', 'gradle.properties');
  let content = await fs.readFile(gradlePropsFile, 'utf8');
  if (!content.match('reactNativeNightly=true')) {
    content += `\nreactNativeNightly=true\n`;
    await fs.writeFile(gradlePropsFile, content);
  }
}
