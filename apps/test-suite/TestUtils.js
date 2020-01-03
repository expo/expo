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

function optionalRequire(requirer) {
  try {
    return requirer();
  } catch (e) {
    // eslint-disable-next-line
    return;
  }
}

// List of all modules for tests. Each file path must be statically present for
// the packager to pick them all up.
export function getTestModules() {
  const modules = [
    // Sanity
    require('./tests/Basic'),
  ];

  // Expo core modules should run everywhere
  modules.push(
    require('./tests/Asset'),
    require('./tests/Constants'),
    require('./tests/FileSystem'),
    require('./tests/Font'),
    require('./tests/Permissions'),
    require('./tests/ImagePicker')
  );

  // Universally tested APIs
  modules.push(
    require('./tests/Random'),
    require('./tests/Crypto'),
    require('./tests/KeepAwake'),
    require('./tests/Blur'),
    require('./tests/LinearGradient'),
    require('./tests/Facebook'),
    require('./tests/FirebaseCore'),
    require('./tests/FirebaseAnalytics')
  );

  if (Platform.OS === 'android') {
    modules.push(require('./tests/JSC'));
  }

  if (global.DETOX) {
    modules.push(
      require('./tests/Contacts'),
      require('./tests/Haptics'),
      require('./tests/Localization'),
      require('./tests/SecureStore'),
      require('./tests/SMS'),
      require('./tests/StoreReview'),
      require('./tests/NewNotifications')
    );
    return modules;
  }

  if (Platform.OS === 'web') {
    modules.push(
      require('./tests/Contacts'),
      // require('./tests/SVG'),
      require('./tests/Localization'),
      optionalRequire(() => require('./tests/NewNotifications'))
    );

    if (browserSupportsWebGL()) {
      modules.push(optionalRequire(() => require('./tests/GLView')));
    }

    if (ExponentTest && !ExponentTest.isInCI) {
      // modules.push(optionalRequire(() => require('./tests/Speech')));
    }
    return modules.filter(Boolean);
  }

  modules.push(
    optionalRequire(() => require('./tests/Application')),
    optionalRequire(() => require('./tests/Device')),
    optionalRequire(() => require('./tests/GLView')),
    optionalRequire(() => require('./tests/Haptics')),
    optionalRequire(() => require('./tests/Localization')),
    optionalRequire(() => require('./tests/Network')),
    optionalRequire(() => require('./tests/SecureStore')),
    optionalRequire(() => require('./tests/Segment')),
    optionalRequire(() => require('./tests/SQLite')),
    optionalRequire(() => require('./tests/Speech')),
    optionalRequire(() => require('./tests/Recording')),
    optionalRequire(() => require('./tests/ScreenOrientation')),
    optionalRequire(() => require('./tests/Payments')),
    optionalRequire(() => require('./tests/AdMobInterstitial')),
    optionalRequire(() => require('./tests/AdMobRewarded')),
    optionalRequire(() => require('./tests/FBBannerAd')),
    optionalRequire(() => require('./tests/NewNotifications'))
  );

  if (!isDeviceFarm()) {
    // Times out sometimes
    modules.push(
      optionalRequire(() => require('./tests/AdMobPublisherBanner')),
      optionalRequire(() => require('./tests/AdMobBanner'))
    );
    // Invalid placementId in CI (all tests fail)
    modules.push(optionalRequire(() => require('./tests/FBNativeAd')));
    // Requires interaction (sign in popup)
    modules.push(optionalRequire(() => require('./tests/GoogleSignIn')));
    // Popup to request device's location which uses Google's location service
    modules.push(optionalRequire(() => require('./tests/Location')));
    // Fails to redirect because of malformed URL in published version with release channel parameter
    modules.push(optionalRequire(() => require('./tests/Linking')));
    // Has uncontrolled view controllers
    modules.push(require('./tests/SMS'));
    // Requires permission
    modules.push(optionalRequire(() => require('./tests/Calendar')));
    modules.push(optionalRequire(() => require('./tests/Permissions')));
    modules.push(optionalRequire(() => require('./tests/MediaLibrary')));
    modules.push(optionalRequire(() => require('./tests/Notifications')));

    modules.push(optionalRequire(() => require('./tests/Battery')));
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
