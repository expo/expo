'use strict';

import { Platform } from 'react-native';
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

// List of all modules for tests. Each file path must be statically present for
// the packager to pick them all up.
export function getTestModules() {
  if (Platform.OS === 'web') {
    const modules = [
      require('./tests/Basic'),
      require('./tests/Constants'),
      require('./tests/SVG'),
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
      // modules.push(require('./tests/Speech'));
    }
    return modules;
  }

  const modules = [
    require('./tests/Basic'),
    require('./tests/Asset'),
    require('./tests/Constants'),
    require('./tests/Crypto'),
    require('./tests/FileSystem'),
    require('./tests/GLView'),
    require('./tests/Haptics'),
    require('./tests/Localization'),
    require('./tests/Recording'),
    require('./tests/ScreenOrientation'),
    require('./tests/SecureStore'),
    require('./tests/Segment'),
    require('./tests/Speech'),
    require('./tests/SQLite'),
    require('./tests/Random'),
    require('./tests/Payments'),
    require('./tests/AdMobInterstitial'),
    require('./tests/AdMobBanner'),
    require('./tests/AdMobPublisherBanner'),
    require('./tests/AdMobRewarded'),
    require('./tests/FBBannerAd'),
  ];
  if (ExponentTest && !ExponentTest.isInCI) {
    // Invalid placementId in CI (all tests fail)
    modules.push(require('./tests/FBNativeAd'));
    // Requires interaction (sign in popup)
    modules.push(require('./tests/GoogleSignIn'));
    // Popup to request device's location which uses Google's location service
    modules.push(require('./tests/Location'));
    // Fails to redirect because of malformed URL in published version with release channel parameter
    modules.push(require('./tests/Linking'));
    // Requires permission
    modules.push(require('./tests/Calendar'));
    modules.push(require('./tests/Contacts'));
    modules.push(require('./tests/Permissions'));
    modules.push(require('./tests/MediaLibrary'));
    modules.push(require('./tests/Notifications'));
    if (Constants.isDevice) modules.push(require('./tests/Brightness'));
    // Crashes app when mounting component
    modules.push(require('./tests/Video'));
    // "sdkUnversionedTestSuite failed: java.lang.NullPointerException: Attempt to invoke interface method
    // 'java.util.Map org.unimodules.interfaces.taskManager.TaskInterface.getOptions()' on a null object reference"
    modules.push(require('./tests/TaskManager'));
    // Audio tests are flaky in CI due to asynchronous fetching of resources
    modules.push(require('./tests/Audio'));
    // The Camera tests are flaky on iOS, i.e. they fail randomly
    if (Constants.isDevice && Platform.OS === 'android') modules.push(require('./tests/Camera'));
  }
  if (Platform.OS === 'android') modules.push(require('./tests/JSC'));
  if (Constants.isDevice) {
    modules.push(require('./tests/BarCodeScanner'));
  }
  return modules;
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
