import './utils/catchRequireErrors';

import { Platform, UnavailabilityError } from '@unimodules/core';
import Constants from 'expo-constants';

import ExponentTest from './ExponentTest';

function optionalRequire(requirer) {
  try {
    return requirer();
  } catch (e) {
    // eslint-disable-next-line
    return;
  }
}

function getTestsForPlatform() {
  if (Platform.OS === 'web') {
    const modules = [
      optionalRequire(() => require('./tests/Asset')),
      optionalRequire(() => require('./tests/SVG')),
      optionalRequire(() => require('./tests/Basic')),
      optionalRequire(() => require('./tests/Constants')),
      optionalRequire(() => require('./tests/Contacts')),
      optionalRequire(() => require('./tests/Crypto')),
      optionalRequire(() => require('./tests/Font')),
      optionalRequire(() => require('./tests/Random')),
      optionalRequire(() => require('./tests/Localization')),
    ];
    return modules;
  }

  const modules = [
    // optionalRequire(() => require('./tests/AdMobBanner')),
    // optionalRequire(() => require('./tests/AdMobInterstitial')),
    // optionalRequire(() => require('./tests/AdMobPublisherBanner')),
    // optionalRequire(() => require('./tests/AdMobRewarded')),
    optionalRequire(() => require('./tests/Asset')),
    optionalRequire(() => require('./tests/Audio')),
    // optionalRequire(() => require('./tests/BarCodeScanner')),
    require('./tests/Basic'),
    optionalRequire(() => require('./tests/Brightness')),
    optionalRequire(() => require('./tests/Calendar')),
    // optionalRequire(() => require('./tests/Camera')),
    optionalRequire(() => require('./tests/Constants')),
    optionalRequire(() => require('./tests/Contacts')),
    optionalRequire(() => require('./tests/Crypto')),
    // optionalRequire(() => require('./tests/FBBannerAd')),
    // optionalRequire(() => require('./tests/FBNativeAd')),
    optionalRequire(() => require('./tests/FileSystem')),
    optionalRequire(() => require('./tests/Font')),
    optionalRequire(() => require('./tests/GLView')),
    // optionalRequire(() => require('./tests/GoogleSignIn')),
    optionalRequire(() => require('./tests/Haptics')),
    optionalRequire(() => require('./tests/ImageManipulator')),
    optionalRequire(() => require('./tests/JSC')),
    optionalRequire(() => require('./tests/Linking')),
    optionalRequire(() => require('./tests/Localization')),
    optionalRequire(() => require('./tests/Location')),
    optionalRequire(() => require('./tests/MediaLibrary')),
    optionalRequire(() => require('./tests/Notifications')),
    optionalRequire(() => require('./tests/Payments')),
    optionalRequire(() => require('./tests/Permissions')),
    optionalRequire(() => require('./tests/Random')),
    optionalRequire(() => require('./tests/Recording')),
    optionalRequire(() => require('./tests/ScreenOrientation')),
    optionalRequire(() => require('./tests/SecureStore')),
    // optionalRequire(() => require('./tests/Segment')),
    optionalRequire(() => require('./tests/Speech')),
    optionalRequire(() => require('./tests/SQLite')),
    optionalRequire(() => require('./tests/SVG')),
    optionalRequire(() => require('./tests/TaskManager')),
    optionalRequire(() => require('./tests/Video')),
  ];

  // availableTests = modules.filter(Boolean);
  // return availableTests.reduce(
  //   (previous, current) => ({ ...previous, [current.name]: current.test }),
  //   {}
  // );
  return modules;
}

// List of all modules for tests. Each file path must be statically present for
// the packager to pick them all up.
export async function getTestModulesAsync() {
  const modules = getTestsForPlatform().filter(Boolean);

  let availableTests = [];

  const isDeviceFarm = ExponentTest && ExponentTest.isInCI && Platform.OS === 'android';

  const env = {
    isDeviceFarm,
    isAutomated: isDeviceFarm || !!global.DETOX,
    isDevice: Constants.isDevice,
    isDetox: !!global.DETOX,
    OS: Platform.OS,
  };

  for (const module of modules) {
    if (module.canRunAsync) {
      if (await module.canRunAsync(env)) availableTests.push(module);
    } else {
      availableTests.push(module);
    }
  }

  return availableTests.sort((a, b) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });
}

export async function acceptPermissionsAndRunCommandAsync(fn) {
  if (!ExponentTest) {
    return await fn();
  }

  const results = await Promise.all([
    ExponentTest.action({
      selectorType: 'text',
      selectorValue: 'Allow',
      actionType: 'click',
      delay: 1000,
      timeout: 100,
    }),
    fn(),
  ]);

  return results[1];
}

export async function shouldSkipTestsRequiringPermissionsAsync() {
  if (!ExponentTest || !ExponentTest.shouldSkipTestsRequiringPermissionsAsync) {
    return false;
  }
  return ExponentTest.shouldSkipTestsRequiringPermissionsAsync();
}

export async function expectMethodToBeUnavailableAsync(expect, method) {
  const error = await expectMethodToThrowAsync(method);
  expect(error instanceof UnavailabilityError).toBeTruthy();
}

export async function expectMethodToThrowAsync(method) {
  try {
    await method();
  } catch (error) {
    return error;
  }
}
