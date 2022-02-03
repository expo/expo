// This list lets us skip over exports that throw an error when we import them, which can happen
// when we add or change a native module and haven't yet updated the mocks in jest-expo. This list
// is a temporary workaround, not a way to indefinitely avoid testing modules.
const skippedExports: string[] = [
  'Accelerometer',
  'AdMobBanner',
  'AdMobInterstitial',
  'AdMobRewarded',
  'Animated',
  'Amplitude',
  'AppAuth',
  'AR',
  'AppLoading',
  'Asset',
  'Audio',
  'AuthSession',
  'BackgroundFetch',
  'BarCodeScanner',
  'Barometer',
  'BlurView',
  'Brightness',
  'Calendar',
  'Camera',
  'Constants',
  'Contacts',
  'Crypto',
  'DocumentPicker',
  'Easing',
  'ErrorRecovery',
  'Facebook',
  'FacebookAds',
  'FaceDetector',
  'FileSystem',
  'Font',
  'GestureHandler',
  'GL',
  'GLView',
  'GoogleSignIn',
  'Google',
  'Gyroscope',
  'Haptic',
  'Haptics',
  'Icon',
  'ImageManipulator',
  'ImagePicker',
  'IntentLauncher',
  'IntentLauncherAndroid',
  'KeepAwake',
  'LinearGradient',
  'LocalAuthentication',
  'Localization',
  'Location',
  'Magnetometer',
  'MagnetometerUncalibrated',
  'MailComposer',
  'MapView',
  'MediaLibrary',
  'Pedometer',
  'Permissions',
  'Print',
  'PublisherBanner',
  'Random',
  'ScreenOrientation',
  'SecureStore',
  'Segment',
  'Sensors',
  'Sharing',
  'SMS',
  'Speech',
  'SplashScreen',
  'SQLite',
  'StoreReview',
  'Svg',
  'takeSnapshotAsync',
  'TaskManager',
  'Transition',
  'Transitioning',
  'Updates',
  'Video',
  'WebBrowser',
  'WebView',
];

// This list lets us define native modules that we consider always available
// even in bare React Native.
//
// We use this array in "importing Expo > throws a clear error in bare React Native"
// where we clear all the native modules to simulate a bare environment. Some of the native modules though
// are expected to be present by React Native, like SourceCode which is fetched with
// TurboModuleRegistry.getEnforcing, which throws an error if the module is not there.
// Since bare React Native would have the SourceCode module let's not remove it
// when preparing NativeModules to simulate bare environment.
const bareReactNativeModulesNames = ['SourceCode'];

describe(`Expo APIs`, () => {
  const Expo = require('../Expo');

  const exportNames = Object.keys(Expo);
  for (const exportName of exportNames) {
    const testName = `exports "${exportName}"`;
    const test = () => {
      expect(() => Expo[exportName]).not.toThrow();

      // Ensure we export the default export instead of the module record itself
      const module = Expo[exportName];
      if (module && module.__esModule) {
        expect(module).not.toHaveProperty('default');
      }
    };

    if (skippedExports.includes(exportName)) {
      it.skip(testName, test);
    } else {
      it(testName, test);
    }
  }
});

jest.mock('react-native/Libraries/Core/Devtools/getDevServer', () => ({
  __esModule: true,
  default() {
    return { bundleLoadedFromServer: true, url: 'http://localhost:8081/' };
  },
}));

describe(`importing Expo`, () => {
  beforeAll(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.resetModules();
  });

  it(`throws a clear error in bare React Native`, () => {
    const clearPropertiesInPlace = (aThing) => {
      const propertyNames = Object.keys(aThing);
      for (const propertyName of propertyNames) {
        if (!bareReactNativeModulesNames.includes(propertyName)) {
          Object.defineProperty(aThing, propertyName, {
            configurable: true,
            enumerable: true,
            writable: true,
            value: undefined,
          });
        }
      }
    };
    // Clear all the native modules as a way to simulate running outside of Expo
    const { NativeModules } = require('react-native');
    const { NativeModulesProxy } = require('expo-modules-core');
    clearPropertiesInPlace(NativeModules);
    clearPropertiesInPlace(NativeModulesProxy);

    // Silence "No native module found" warnings raised in CRNA and expo-constants
    const warn = console.warn;

    global.console.warn = (str) => {
      const tst = (str || '') + '';
      if (!tst.includes('No native')) {
        warn.apply(console, [str]);
      }
    };

    expect(() => require('../Expo')).toThrowErrorMatchingSnapshot();
  });
});
