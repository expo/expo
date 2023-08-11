import { Command } from '@expo/commander';
import JsonFile from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';
import assert from 'assert';
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

  logger.info('Adding bare-expo optional packages:');
  await addBareExpoOptionalPackagesAsync();

  logger.info('Adding pinned packages:');
  const pinnedPackages = {
    'react-native': nightlyVersion,
    '@react-native-async-storage/async-storage': '~1.19.1', // fix AGP 8 build error
    '@react-native-community/netinfo': '~9.4.1', // fix AGP 8 build error
  };
  await addPinnedPackagesAsync(pinnedPackages);

  logger.info('Yarning...');
  await workspaceInstallAsync();

  await updateReactNativePackageAsync();

  await patchAndroidBuildConfigAsync();
  await patchReactNavigationAsync();
  await patchDetoxAsync();
  await patchReanimatedAsync();
  await patchScreensAsync();
  await patchGestureHandlerAsync();

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

async function updateReactNativePackageAsync() {
  const reactNativeRoot = path.join(EXPO_DIR, 'node_modules', 'react-native');

  // Update native ReactNativeVersion
  const versions = (process.env.REACT_NATIVE_OVERRIDE_VERSION ?? '9999.9999.9999').split('.');
  await transformFileAsync(
    path.join(
      reactNativeRoot,
      'ReactAndroid/src/main/java/com/facebook/react/modules/systeminfo/ReactNativeVersion.java'
    ),
    [
      {
        find: /("major", )\d+,/g,
        replaceWith: `$1${versions[0]},`,
      },
      {
        find: /("minor", )\d+,/g,
        replaceWith: `$1${versions[1]},`,
      },
      {
        find: /("patch", )\d+,/g,
        replaceWith: `$1${versions[2]},`,
      },
    ]
  );

  // Workaround build error for React-bridging depending on butter
  // const bridgingFiles = await glob('ReactCommon/react/bridging/*.{h,cpp}', {
  //   cwd: reactNativeRoot,
  //   absolute: true,
  // });
  // await Promise.all(
  //   bridgingFiles.map((file) =>
  //     transformFileAsync(file, [
  //       {
  //         find: /<butter\/map\.h>/g,
  //         replaceWith: '<map>',
  //       },
  //       {
  //         find: /<butter\/function\.h>/g,
  //         replaceWith: '<functional>',
  //       },
  //       {
  //         find: /butter::(map|function)/g,
  //         replaceWith: 'std::$1',
  //       },
  //     ])
  //   )
  // );
}

async function patchReactNavigationAsync() {
  await transformFileAsync(
    path.join(EXPO_DIR, 'node_modules', '@react-navigation/elements', 'src/Header/Header.tsx'),
    [
      {
        // Weird that the nightlies will break if pass `undefined` to the `transform` prop
        find: 'style={[{ height, minHeight, maxHeight, opacity, transform }]}',
        replaceWith:
          'style={[{ height, minHeight, maxHeight, opacity, transform: transform ?? [] }]}',
      },
    ]
  );
}

async function patchDetoxAsync() {
  await transformFileAsync(
    path.join(EXPO_DIR, 'node_modules', 'detox', 'android/detox/build.gradle'),
    [
      {
        // namespace
        find: /^(android \{[\s\S]*?)(\n})/gm,
        replaceWith: '$1\n  namespace "com.wix.detox"\n$2',
      },
    ]
  );
}

async function patchReanimatedAsync() {
  await transformFileAsync(
    path.join(
      EXPO_DIR,
      'node_modules',
      'react-native-reanimated',
      'android/src/main/java/com/swmansion/reanimated/keyboardObserver/ReanimatedKeyboardEventListener.java'
    ),
    [
      {
        // AGP 8 `nonTransitiveRClass`
        find: /\bcom\.swmansion\.reanimated\.(R\.id\.action_bar_root)/g,
        replaceWith: 'androidx.appcompat.$1',
      },
    ]
  );
}

async function patchScreensAsync() {
  await transformFileAsync(
    path.join(
      EXPO_DIR,
      'node_modules',
      'react-native-screens',
      'android/src/main/java/com/swmansion/rnscreens/ScreenStackHeaderConfig.kt'
    ),
    [
      {
        // AGP 8 `nonTransitiveRClass`
        find: /\b(R\.attr\.colorPrimary)/g,
        replaceWith: 'android.$1',
      },
    ]
  );
}

async function patchGestureHandlerAsync() {
  await transformFileAsync(
    path.join(
      EXPO_DIR,
      'node_modules',
      'react-native-gesture-handler',
      'android/src/main/java/com/swmansion/gesturehandler/react/RNGestureHandlerModule.kt'
    ),
    [
      {
        find: 'decorateRuntime(jsContext.get())',
        replaceWith: 'decorateRuntime(jsContext!!.get())',
      },
    ]
  );
}

async function updateExpoModulesAsync() {
  // no-op currently
}

async function updateBareExpoAsync(nightlyVersion: string) {
  const root = path.join(EXPO_DIR, 'apps', 'bare-expo');
  await transformFileAsync(path.join(root, 'ios', 'Podfile'), [
    {
      find: /(platform :ios, )['"]13\.0['"]/g,
      replaceWith: "$1'13.4'",
    },
  ]);

  // flipper-integration
  await transformFileAsync(path.join(root, 'android', 'app', 'build.gradle'), [
    {
      find: 'debugImplementation("com.facebook.flipper:flipper-fresco-plugin:${FLIPPER_VERSION}")',
      replaceWith: 'debugImplementation("com.facebook.fresco:flipper-fresco-plugin:3.0.0")',
    },
  ]);
  await transformFileAsync(path.join(root, 'android', 'gradle.properties'), [
    {
      find: /FLIPPER_VERSION=0\.182\.0/,
      replaceWith: 'FLIPPER_VERSION=0.201.0',
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

  const missingNamespaceModules = {
    '@shopify/flash-list': 'com.shopify.reactnative.flash_list',
    '@shopify/react-native-skia': 'com.shopify.reactnative.skia',
    '@react-native-community/slider': 'com.reactnativecommunity.slider',
    '@react-native-masked-view/masked-view': 'org.reactnative.maskedview',
    '@react-native-picker/picker': 'com.reactnativecommunity.picker',
    'react-native-maps': 'com.rnmaps.maps',
    'react-native-pager-view': 'com.reactnativepagerview',
    'react-native-view-shot': 'fr.greweb.reactnativeviewshot',
    'react-native-webview': 'com.reactnativecommunity.webview',
  };
  for (const [module, namespace] of Object.entries(missingNamespaceModules)) {
    const gradleFile = path.join(EXPO_DIR, 'node_modules', module, 'android', 'build.gradle');
    await transformFileAsync(gradleFile, [
      {
        find: searchPattern,
        replaceWith: `$1\n  namespace "${namespace}"\n$2`,
      },
    ]);
  }
}
