// @flow
import './environment/validate';
import './environment/logging';

import 'expo-location/src/Location'; // polyfill navigator.geolocation
import 'expo-asset/src/Asset'; // load expo-asset immediately, as it sets custom source transformer in React Native)
import { Constants } from 'expo-constants';
import { NativeModules, Platform, YellowBox } from 'react-native';

// ignore annoying deprecation warnings stemming from react-native JS internals
// TODO: remove this once there are no more calls to isMounted() in react-native
YellowBox.ignoreWarnings(['Warning: isMounted(...) is deprecated', 'Module RCTImageLoader']);

if (typeof Constants.manifest.env === 'object') {
  Object.assign(process.env, Constants.manifest.env);
}

// ignore annoying deprecation warnings stemming from react-native JS internals
// TODO: remove this once there are no more calls to isMounted() in react-native
global.__old_console_warn = global.__old_console_warn || console.warn;
global.console.warn = (...args) => {
  let tst = (args[0] || '') + '';
  if (tst.startsWith('Warning: isMounted(...) is deprecated')) {
    return;
  }
  return global.__old_console_warn.apply(console, args);
};

module.exports = {
  // constants
  get Crypto() {
    return NativeModules.ExponentCrypto;
  },
  get Fabric() {
    return NativeModules.ExponentFabric;
  },
  get ImageCropper() {
    return NativeModules.ExponentImageCropper;
  },

  // defaults
  get apisAreAvailable() {
    return require('./apisAreAvailable').default;
  },
  get registerRootComponent() {
    return require('./launch/registerRootComponent').default;
  },
  get takeSnapshotAsync() {
    return require('./takeSnapshotAsync').default;
  },
  get Accelerometer() {
    return require('expo-sensors').Accelerometer;
  },
  get Asset() {
    return require('expo-asset').Asset;
  },
  get AuthSession() {
    return require('./AuthSession').default;
  },
  get ErrorRecovery() {
    return require('./ErrorRecovery').default;
  },
  get GLView() {
    return require('expo-gl').GLView;
  },
  get Gyroscope() {
    return require('expo-sensors').Gyroscope;
  },
  get Magnetometer() {
    return require('expo-sensors').Magnetometer;
  },
  get MagnetometerUncalibrated() {
    return require('expo-sensors').MagnetometerUncalibrated;
  },
  get Notifications() {
    return require('./Notifications').default;
  },
  get SQLite() {
    return require('./SQLite').default;
  },

  // components
  get AdMobBanner() {
    return require('expo-ads-admob').AdMobBanner;
  },
  get PublisherBanner() {
    return require('expo-ads-admob').PublisherBanner;
  },
  get AdMobInterstitial() {
    return require('expo-ads-admob').AdMobInterstitial;
  },
  get AdMobRewarded() {
    return require('expo-ads-admob').AdMobRewarded;
  },
  get AppLoading() {
    return require('./launch/AppLoading').default;
  },
  get BarCodeScanner() {
    return require('expo-barcode-scanner').BarCodeScanner;
  },
  get BlurView() {
    return require('./effects/BlurView').default;
  },
  get Camera() {
    return require('expo-camera').Camera;
  },
  get FaceDetector() {
    return require('expo-face-detector').FaceDetector;
  },
  get GestureHandler() {
    return require('react-native-gesture-handler');
  },
  get KeepAwake() {
    return require('./KeepAwake').default;
  },
  get LinearGradient() {
    return require('./effects/LinearGradient').default;
  },
  get MapView() {
    return require('react-native-maps').default;
  },
  get Modal() {
    console.error('The undocumented Modal API has been removed.');
  },
  get Video() {
    return require('./av/Video').default;
  },
  get WebBrowser() {
    return require('./WebBrowser').default;
  },
  get Svg() {
    return require('./Svg').default;
  },
  get Fingerprint() {
    console.warn(
      'Expo.Fingerprint has been renamed to Expo.LocalAuthentication. The old name might be removed in the future releases.'
    );
    return this.LocalAuthentication;
  },
  get LocalAuthentication() {
    return require('expo-local-authentication').LocalAuthentication;
  },

  // globs
  get Amplitude() {
    return require('./Amplitude').default;
  },
  get AR() {
    return require('./AR');
  },
  get Audio() {
    return require('./av/Audio');
  },
  get Brightness() {
    return require('./Brightness');
  },
  get Calendar() {
    return require('./Calendar');
  },
  get Constants() {
    return require('expo-constants').Constants;
  },
  get Contacts() {
    return require('expo-contacts').Contacts;
  },
  get DangerZone() {
    return require('./DangerZone');
  },
  get DocumentPicker() {
    return require('./DocumentPicker');
  },
  get FileSystem() {
    return require('expo-file-system').FileSystem;
  },
  get Font() {
    return require('expo-font').Font;
  },
  get Google() {
    return require('./Google');
  },
  get Haptic() {
    return require('./Haptic');
  },
  get Icon() {
    return require('./Icon').default;
  },
  get ImageManipulator() {
    return require('./ImageManipulator');
  },
  get ImagePicker() {
    return require('./ImagePicker');
  },
  get Linking() {
    return require('./Linking').default;
  },
  get Location() {
    return require('expo-location').Location;
  },
  get Logs() {
    return require('./logs/Logs').default;
  },
  get MailComposer() {
    return require('./MailComposer');
  },
  get MediaLibrary() {
    return require('expo-media-library').MediaLibrary;
  },
  get Pedometer() {
    if (Platform.OS === 'android') {
      return require('./Pedometer');
    } else {
      return require('expo-sensors').Pedometer;
    }
  },
  get Permissions() {
    return require('expo-permissions').Permissions;
  },
  get Print() {
    return require('expo-print').Print;
  },
  get Facebook() {
    return require('./Facebook').default;
  },
  get FacebookAds() {
    return require('./facebook-ads');
  },
  get IntentLauncherAndroid() {
    return require('./IntentLauncherAndroid');
  },
  get ScreenOrientation() {
    return require('./ScreenOrientation');
  },
  get SecureStore() {
    return require('./SecureStore');
  },
  get Segment() {
    return require('expo-analytics-segment').Segment;
  },
  get SMS() {
    return require('expo-sms').SMS;
  },
  get Speech() {
    return require('./Speech');
  },
  get SplashScreen() {
    return require('./launch/SplashScreen');
  },
  get StoreReview() {
    return require('./StoreReview');
  },
  get Updates() {
    return require('./Updates');
  },
  get Util() {
    return require('./Util');
  },
};

if (global) {
  global.__exponent = module.exports;
  global.__expo = module.exports;
  global.Expo = module.exports;
}
