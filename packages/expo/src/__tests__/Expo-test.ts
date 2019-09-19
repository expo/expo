// This list lets us skip over exports that throw an error when we import them, which can happen
// when we add or change a native module and haven't yet updated the mocks in jest-expo. This list
// is a temporary workaround, not a way to indefinitely avoid testing modules.
const skippedExports: string[] = [
  'IntentLauncherAndroid',
  'Localization',
  'Accelerometer',
  'AdMobBanner',
  'AdMobInterstitial',
  'AdMobRewarded',
  'Animated',
  'Amplitude',
  'AppAuth',
  'Asset',
  'Audio',
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
  'SecureStore',
  'Segment',
  'Sensors',
  'Sharing',
  'SMS',
  'Speech',
  'SQLite',
  'Svg',
  'takeSnapshotAsync',
  'TaskManager',
  'Transition',
  'Transitioning',
  'Video',
  'WebBrowser',
  'WebView',
];

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

describe(`importing Expo`, () => {
  beforeAll(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.resetModules();
  });

  it(`throws a clear error in bare React Native`, () => {
    const clearPropertiesInPlace = aThing => {
      const propertyNames = Object.keys(aThing);
      for (const propertyName of propertyNames) {
        Object.defineProperty(aThing, propertyName, {
          configurable: true,
          enumerable: true,
          writable: true,
          value: undefined,
        });
      }
    };
    // Clear all the native modules as a way to simulate running outside of Expo
    const { NativeModules } = require('react-native');
    const { NativeModulesProxy } = require('@unimodules/react-native-adapter');
    clearPropertiesInPlace(NativeModules);
    clearPropertiesInPlace(NativeModulesProxy);

    // Silence "No native module found" warnings raised in CRNA and expo-constants
    const warn = console.warn;

    global.console.warn = str => {
      let tst = (str || '') + '';
      if (!tst.includes('No native')) {
        warn.apply(console, [str]);
      }
    };

    expect(() => require('../Expo')).toThrowErrorMatchingSnapshot();
  });
});
