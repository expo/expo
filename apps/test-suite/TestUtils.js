'use strict';

import { Platform, UnavailabilityError } from '@unimodules/core';
import Constants from 'expo-constants';
import { isDeviceFarm } from './utils/Environment';
import ExponentTest from './ExponentTest';

function browserSupportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return (
      !!window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

function getIOSDetoxModules() {
  return [
    require('./tests/Application'),
    // require('./tests/Device'),
    require('./tests/Network'),
    require('./tests/Asset'),
    require('./tests/Basic'),
    require('./tests/Constants'),
    require('./tests/Contacts'),
    require('./tests/Crypto'),
    require('./tests/Font'),
    require('./tests/Random'),
    require('./tests/Localization'),
    require('./tests/Permissions'),
    require('./tests/SecureStore'),
    require('./tests/Haptics'),
    // require('./tests/GLView',
    // require('./tests/Segment',
    // require('./tests/SQLite',
    // require('./tests/Calendar'),
    // require('./tests/Video'),
    // require('./tests/Audio')
  ];
}

// List of all modules for tests. Each file path must be statically present for
// the packager to pick them all up.
export function getTestModules() {
  if (global.DETOX) {
    return getIOSDetoxModules();
  } else if (Platform.OS === 'web') {
    const modules = [
      // require('./tests/SVG',
      require('./tests/Asset'),
      require('./tests/Basic'),
      require('./tests/Constants'),
      require('./tests/Contacts'),
      require('./tests/Crypto'),
      require('./tests/Font'),
      require('./tests/Random'),
      require('./tests/Localization'),
    ];

    if (browserSupportsWebGL()) {
      modules.push(require('./tests/GLView'));
    }

    if (ExponentTest && !ExponentTest.isInCI) {
      // modules.push(require('./tests/Speech');
    }
    return modules.filter(Boolean);
  }

  const modules = [
    require('./tests/Basic'),
    require('./tests/Contacts'),
    require('./tests/Application'),
    require('./tests/Asset'),
    require('./tests/Constants'),
    require('./tests/Crypto'),
    require('./tests/Device'),
    require('./tests/GLView'),
    require('./tests/Haptics'),
    require('./tests/Localization'),
    require('./tests/Network'),
    require('./tests/SecureStore'),
    require('./tests/Segment'),
    require('./tests/SQLite'),
    require('./tests/Random'),
    require('./tests/Speech'),
    require('./tests/Recording'),
    require('./tests/FileSystem'),
    require('./tests/ScreenOrientation'),
    require('./tests/Payments'),
    require('./tests/AdMobInterstitial'),
    require('./tests/AdMobRewarded'),
    require('./tests/FBBannerAd'),
  ];

  if (!isDeviceFarm()) {
    // Times out sometimes
    modules.push(
      require('./tests/AdMobPublisherBanner'),
      require('./tests/AdMobBanner'),
      // Invalid placementId in CI (all tests fail)
      require('./tests/FBNativeAd'),
      // Requires interaction (sign in popup)
      require('./tests/GoogleSignIn'),
      // Popup to request device's location which uses Google's location service
      require('./tests/Location'),
      // Fails to redirect because of malformed URL in published version with release channel parameter
      require('./tests/Linking'),
      // Requires permission
      require('./tests/Calendar'),
      require('./tests/Permissions'),
      require('./tests/MediaLibrary'),
      require('./tests/Notifications'),
      // Crashes app when mounting component
      require('./tests/Video'),
      // "sdkUnversionedTestSuite failed: java.lang.NullPointerException: Attempt to invoke interface method
      // 'java.util.Map org.unimodules.interfaces.taskManager.TaskInterface.getOptions()' on a null object reference"
      require('./tests/TaskManager'),
      // Audio tests are flaky in CI due to asynchronous fetching of resources
      require('./tests/Audio')
    );
    if (Constants.isDevice) {
      modules.push(require('./tests/Battery'), require('./tests/Brightness'));
    }

    // The Camera tests are flaky on iOS, i.e. they fail randomly
    if (Constants.isDevice && Platform.OS === 'android') modules.push(require('./tests/Camera'));
  }
  if (Platform.OS === 'android') modules.push(require('./tests/JSC'));
  if (Constants.isDevice) {
    modules.push(require('./tests/Cellular'), require('./tests/BarCodeScanner'));
  }
  return modules.filter(Boolean);
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
