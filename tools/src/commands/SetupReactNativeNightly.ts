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

    // Remove this after we upgrade reanimated
    'react-native-reanimated': '2.10.0',
  };
  await addPinnedPackagesAsync(pinnedPackages);

  logger.info('Yarning...');
  await workspaceInstallAsync();

  await updateReactNativePackageAsync();

  await patchReanimatedAsync();

  // Workaround for deprecated `Linking.removeEventListener`
  // Remove this after we migrate to @react-navigation/native@^6.0.12
  // https://linear.app/expo/issue/ENG-4148/upgrade-react-navigation-across-expoexpo-monorepo
  // https://github.com/react-navigation/react-navigation/commit/bd5cd55e130cba2c6c35bbf360e3727a9fcf00e4
  await patchReactNavigationAsync();

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

  // Third party libraries used to use react-native minor version, update the version 1000.999.0 as the latest version
  await transformFileAsync(path.join(root, 'package.json'), [
    {
      find: '"version": "0.0.0-',
      replaceWith: '"version": "1000.999.0-',
    },
  ]);
  await transformFileAsync(path.join(root, 'ReactAndroid', 'gradle.properties'), [
    {
      find: 'VERSION_NAME=1000.0.0-',
      replaceWith: 'VERSION_NAME=1000.999.0-',
    },
  ]);

  // Build hermes source from the main branch
  await fs.writeFile(path.join(root, 'sdks', '.hermesversion'), 'main');
  await transformFileAsync(path.join(root, 'sdks', 'hermes-engine', 'hermes-engine.podspec'), [
    {
      // Use the fake version to force building hermes from source
      find: "version = package['version']",
      replaceWith: "version = '1000.0.0'",
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

async function patchReactNavigationAsync() {
  const root = path.join(EXPO_DIR, 'node_modules', '@react-navigation');
  await transformFileAsync(path.join(root, 'native', 'src', 'useLinking.native.tsx'), [
    {
      find: `\
      Linking.addEventListener('url', callback);

      return () => Linking.removeEventListener('url', callback);`,
      replaceWith: `\
      const subscription = Linking.addEventListener('url', callback);

      return () => subscription.remove();`,
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
