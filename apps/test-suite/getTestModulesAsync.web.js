// List of all modules for tests. Each file path must be statically present for
// the packager to pick them all up.
export default async function getTestModulesAsync() {
  // The tests don't complete on CircleCI on iOS so we test just that the app launches and runs

  let modules = [
    // require('./tests/Basic1'),
    // require('./tests/Basic2'),
    require('./tests/Import1'),
    require('./tests/Import2'),
    require('./tests/Import3'),
    // require('./tests/Asset'),
    // require('./tests/Audio'),
    // require('./tests/Constants'),
    // require('./tests/Contacts'),
    // require('./tests/FileSystem'),
    // require('./tests/GoogleSignIn'),
    // require('./tests/Localization'),
    // /* require('./tests/Location'), */
    // require('./tests/BackgroundLocation'),
    // require('./tests/GeofencingLocation'),
    // require('./tests/Linking'),
    // require('./tests/Recording'),
    // require('./tests/SecureStore'),
    // require('./tests/Segment'),
    // require('./tests/Speech'),
    // require('./tests/SQLite'),
    // require('./tests/Payments'),
    // require('./tests/AdMobInterstitial'),
    // require('./tests/AdMobBanner'),
    // require('./tests/AdMobPublisherBanner'),
    // require('./tests/AdMobRewarded'),
    // require('./tests/Video'),
    // require('./tests/Permissions'),
    // require('./tests/MediaLibrary'),
    // require('./tests/Notifications'),
    // require('./tests/FBNativeAd'),
    // require('./tests/FBBannerAd'),
    // require('./tests/TaskManager'),
    // require('./tests/Camera'),
  ];

  return modules;
}
