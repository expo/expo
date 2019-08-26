'use strict';

import { Platform, UnavailabilityError } from '@unimodules/core';
import Constants from 'expo-constants';

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

function optionalRequire(requirer) {
  try {
    return requirer();
  } catch (e) {
    // eslint-disable-next-line
    return;
  }
}

export function isInDeviceFarm() {
  return ExponentTest && ExponentTest.isInCI && Platform.OS === 'android';
}

// List of all modules for tests. Each file path must be statically present for
// the packager to pick them all up.
export function getTestModules() {
  if (Platform.OS === 'web') {
    const modules = [
      optionalRequire(() => require('./tests/Asset')),
      optionalRequire(() => require('./tests/SVG')),
      optionalRequire(() => require('./tests/Basic')),
      optionalRequire(() => require('./tests/Constants')),
      optionalRequire(() => require('./tests/SVG')),
      optionalRequire(() => require('./tests/Contacts')),
      optionalRequire(() => require('./tests/Crypto')),
      optionalRequire(() => require('./tests/Font')),
      optionalRequire(() => require('./tests/Random')),
      optionalRequire(() => require('./tests/Localization')),
    ];

    if (browserSupportsWebGL()) {
      modules.push(optionalRequire(() => require('./tests/GLView')));
    }

    if (ExponentTest && !ExponentTest.isInCI) {
      // modules.push(optionalRequire(() => require('./tests/Speech')));
    }
    return modules.filter(Boolean);
  }

  const modules = [
    require('./tests/Basic'),
    optionalRequire(() => require('./tests/Application')),
    optionalRequire(() => require('./tests/Asset')),
    optionalRequire(() => require('./tests/Constants')),
    optionalRequire(() => require('./tests/Crypto')),
    optionalRequire(() => require('./tests/Device')),
    optionalRequire(() => require('./tests/GLView')),
    optionalRequire(() => require('./tests/Haptics')),
    optionalRequire(() => require('./tests/Localization')),
    optionalRequire(() => require('./tests/Network')),
    optionalRequire(() => require('./tests/SecureStore')),
    optionalRequire(() => require('./tests/Segment')),
    optionalRequire(() => require('./tests/SQLite')),
    optionalRequire(() => require('./tests/Random')),
  ];

  if (global.DETOX) {
    modules.push(
      modules.push(optionalRequire(() => require('./tests/Permissions'))),
      modules.push(optionalRequire(() => require('./tests/Calendar'))),
      modules.push(optionalRequire(() => require('./tests/Video'))),
      modules.push(optionalRequire(() => require('./tests/Audio')))
    );
  } else {
    modules.push(
      optionalRequire(() => require('./tests/Speech')),
      optionalRequire(() => require('./tests/Recording')),
      optionalRequire(() => require('./tests/FileSystem')),
      optionalRequire(() => require('./tests/ScreenOrientation')),
      optionalRequire(() => require('./tests/Payments')),
      optionalRequire(() => require('./tests/AdMobInterstitial')),
      optionalRequire(() => require('./tests/AdMobBanner')),
      optionalRequire(() => require('./tests/AdMobPublisherBanner')),
      optionalRequire(() => require('./tests/AdMobRewarded')),
      optionalRequire(() => require('./tests/FBBannerAd'))
    );
  }

  if (!global.DETOX && !isInDeviceFarm()) {
    // Invalid placementId in CI (all tests fail)
    modules.push(optionalRequire(() => require('./tests/FBNativeAd')));
    // Requires interaction (sign in popup)
    modules.push(optionalRequire(() => require('./tests/GoogleSignIn')));
    // Popup to request device's location which uses Google's location service
    modules.push(optionalRequire(() => require('./tests/Location')));
    // Fails to redirect because of malformed URL in published version with release channel parameter
    modules.push(optionalRequire(() => require('./tests/Linking')));
    // Requires permission
    modules.push(optionalRequire(() => require('./tests/Calendar')));
    modules.push(optionalRequire(() => require('./tests/Contacts')));
    modules.push(optionalRequire(() => require('./tests/Permissions')));
    modules.push(optionalRequire(() => require('./tests/MediaLibrary')));
    modules.push(optionalRequire(() => require('./tests/Notifications')));
    if (Constants.isDevice) {
      modules.push(optionalRequire(() => require('./tests/Brightness')));
    }
    // Crashes app when mounting component
    modules.push(optionalRequire(() => require('./tests/Video')));
    // "sdkUnversionedTestSuite failed: java.lang.NullPointerException: Attempt to invoke interface method
    // 'java.util.Map org.unimodules.interfaces.taskManager.TaskInterface.getOptions()' on a null object reference"
    modules.push(optionalRequire(() => require('./tests/TaskManager')));
    // Audio tests are flaky in CI due to asynchronous fetching of resources
    modules.push(optionalRequire(() => require('./tests/Audio')));
    // The Camera tests are flaky on iOS, i.e. they fail randomly
    if (Constants.isDevice && Platform.OS === 'android')
      modules.push(optionalRequire(() => require('./tests/Camera')));
  }
  if (Platform.OS === 'android') modules.push(optionalRequire(() => require('./tests/JSC')));
  if (Constants.isDevice) {
    modules.push(optionalRequire(() => require('./tests/Cellular')));
    modules.push(optionalRequire(() => require('./tests/BarCodeScanner')));
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
