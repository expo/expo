'use strict';
import { Constants } from 'expo';
import { Platform } from 'react-native';

import * as TestUtils from './TestUtils';

const isWeb = Platform.OS === 'web';
// List of all modules for tests. Each file path must be statically present for
// the packager to pick them all up.
export default async function getTestModulesAsync() {
  // The tests don't complete on CircleCI on iOS so we test just that the app launches and runs
  if (Platform.OS === 'ios') {
    let isInCI = await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
    if (isInCI) {
      return [];
    }
  }

  let modules = [
    // require('./tests/Basic1'),
    // require('./tests/Basic2'),
    require('./tests/Import1'),
    require('./tests/Import2'),
    require('./tests/Import3'),
    require('./tests/Asset'),
    require('./tests/Audio'),
    require('./tests/Constants'),
    require('./tests/Contacts'),
    require('./tests/FileSystem'),
    require('./tests/GoogleSignIn'),
    require('./tests/Localization'),
    require('./tests/Location'),
    require('./tests/Linking'),
    require('./tests/Recording'),
    require('./tests/SecureStore'),
    require('./tests/Segment'),
    require('./tests/Speech'),
    // require('./tests/SQLite'),
    require('./tests/Payments'),
    require('./tests/AdMobInterstitial'),
    require('./tests/AdMobBanner'),
    require('./tests/AdMobPublisherBanner'),
    require('./tests/AdMobRewarded'),
    require('./tests/Video'),
    require('./tests/Permissions'),
    require('./tests/MediaLibrary'),
    require('./tests/Notifications'),
    require('./tests/FBNativeAd'),
    require('./tests/FBBannerAd'),
    require('./tests/TaskManager'),
  ];
  if (Constants.isDevice && !isWeb) {
    modules = modules.concat([require('./tests/Brightness')]);
    modules = modules.concat([require('./tests/BarCodeScanner')]);
    if (Platform.OS === 'android') {
      modules = modules.concat([require('./tests/JSC')]);
      // The Camera tests are flaky on iOS, i.e. they fail randomly
      modules = modules.concat([require('./tests/Camera')]);
    }
  }
  return modules;
}
