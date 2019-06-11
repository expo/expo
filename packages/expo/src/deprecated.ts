// Importing these modules from the 'expo' package was deprecated in SDK 33.
// Please import them from the each individual unimodule package instead.

import deprecatedModule from './deprecatedModule';

declare var module: any;

Object.defineProperties(module.exports, {
  AdMobBanner: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { AdMobBanner } from 'expo' -> import { AdMobBanner } from 'expo-ads-admob'`,
        'AdMobBanner',
        'expo-ads-admob'
      );
      return require('expo-ads-admob').AdMobBanner;
    },
  },
  AdMobInterstitial: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { AdMobInterstitial } from 'expo' -> import { AdMobInterstitial } from 'expo-ads-admob'`,
        'AdMobInterstitial',
        'expo-ads-admob'
      );
      return require('expo-ads-admob').AdMobInterstitial;
    },
  },
  AdMobRewarded: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { AdMobRewarded } from 'expo' -> import { AdMobRewarded } from 'expo-ads-admob'`,
        'AdMobRewarded',
        'expo-ads-admob'
      );
      return require('expo-ads-admob').AdMobRewarded;
    },
  },
  Animated: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Animated } from 'expo' -> import Animated from 'react-native-reanimated'`,
        'Animated',
        'react-native-reanimated'
      );
      return require('./Animated').default;
    },
  },
  Easing: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Easing } from 'expo' -> import { Easing } from 'react-native-reanimated'`,
        'Easing',
        'react-native-reanimated'
      );
      return require('./Animated').Easing;
    },
  },
  Transition: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Transition } from 'expo' -> import { Transition } from 'react-native-reanimated'`,
        'Transition',
        'react-native-reanimated'
      );
      return require('./Animated').Transition;
    },
  },
  Transitioning: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Transitioning } from 'expo' -> import { Transitioning } from 'react-native-reanimated'`,
        'Transitioning',
        'react-native-reanimated'
      );
      return require('./Animated').Transitioning;
    },
  },
  PublisherBanner: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { PublisherBanner } from 'expo' -> import { PublisherBanner } from 'expo-ads-admob'`,
        'PublisherBanner',
        'expo-ads-admob'
      );
      return require('expo-ads-admob').PublisherBanner;
    },
  },

  FacebookAds: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { FacebookAds } from 'expo' -> import * as FacebookAds from 'expo-ads-facebook'`,
        'FacebookAds',
        'expo-ads-facebook'
      );
      return require('expo-ads-facebook');
    },
  },

  Amplitude: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Amplitude } from 'expo' -> import * as Amplitude from 'expo-analytics-amplitude'`,
        'Amplitude',
        'expo-analytics-amplitude'
      );
      return require('expo-analytics-amplitude');
    },
  },

  Segment: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Segment } from 'expo' -> import * as Segment from 'expo-analytics-segment'`,
        'Segment',
        'expo-analytics-segment'
      );
      return require('expo-analytics-segment');
    },
  },

  AppAuth: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { AppAuth } from 'expo' -> import * as AppAuth from 'expo-app-auth'`,
        'AppAuth',
        'expo-app-auth'
      );
      return require('expo-app-auth');
    },
  },

  Asset: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Asset } from 'expo' -> import { Asset } from 'expo-asset'`,
        'Asset',
        'expo-asset'
      );
      return require('expo-asset').Asset;
    },
  },

  Audio: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Audio } from 'expo' -> import { Audio } from 'expo-av'`,
        'Audio',
        'expo-av'
      );
      return require('expo-av').Audio;
    },
  },
  Video: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Video } from 'expo' -> import { Video } from 'expo-av'`,
        'Video',
        'expo-av'
      );
      return require('expo-av').Video;
    },
  },

  BackgroundFetch: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { BackgroundFetch } from 'expo' -> import * as BackgroundFetch from 'expo-background-fetch'`,
        'BackgroundFetch',
        'expo-background-fetch'
      );
      return require('expo-background-fetch');
    },
  },

  BarCodeScanner: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { BarCodeScanner } from 'expo' -> import { BarCodeScanner } from 'expo-barcode-scanner'`,
        'BarCodeScanner',
        'expo-barcode-scanner'
      );
      return require('expo-barcode-scanner').BarCodeScanner;
    },
  },

  BlurView: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { BlurView } from 'expo' -> import { BlurView } from 'expo-blur'`,
        'BlurView',
        'expo-blur'
      );
      return require('expo-blur').BlurView;
    },
  },

  Brightness: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Brightness } from 'expo' -> import * as Brightness from 'expo-brightness'`,
        'Brightness',
        'expo-brightness'
      );
      return require('expo-brightness');
    },
  },

  Calendar: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Calendar } from 'expo' -> import * as Calendar from 'expo-calendar'`,
        'Calendar',
        'expo-calendar'
      );
      return require('expo-calendar');
    },
  },

  Camera: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Camera } from 'expo' -> import { Camera } from 'expo-camera'`,
        'Camera',
        'expo-camera'
      );
      return require('expo-camera').Camera;
    },
  },

  Constants: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Constants } from 'expo' -> import Constants from 'expo-constants'`,
        'Constants',
        'expo-constants'
      );
      return require('expo-constants').default;
    },
  },

  Contacts: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Contacts } from 'expo' -> import * as Contacts from 'expo-contacts'`,
        'Contacts',
        'expo-contacts'
      );
      return require('expo-contacts');
    },
  },

  Crypto: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Crypto } from 'expo' -> import * as Crypto from 'expo-crypto'`,
        'Crypto',
        'expo-crypto'
      );
      return require('expo-crypto');
    },
  },

  DocumentPicker: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { DocumentPicker } from 'expo' -> import * as DocumentPicker from 'expo-document-picker'`,
        'DocumentPicker',
        'expo-document-picker'
      );
      return require('expo-document-picker');
    },
  },

  FaceDetector: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { FaceDetector } from 'expo' -> import * as FaceDetector from 'expo-face-detector'`,
        'FaceDetector',
        'expo-face-detector'
      );
      return require('expo-face-detector');
    },
  },

  Facebook: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Facebook } from 'expo' -> import * as Facebook from 'expo-facebook'`,
        'Facebook',
        'expo-facebook'
      );
      return require('expo-facebook');
    },
  },

  FileSystem: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { FileSystem } from 'expo' -> import * as FileSystem from 'expo-file-system'`,
        'FileSystem',
        'expo-file-system'
      );
      return require('expo-file-system');
    },
  },

  Font: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Font } from 'expo' -> import * as Font from 'expo-font'`,
        'Font',
        'expo-font'
      );
      return require('expo-font');
    },
  },

  GL: {
    enumerable: true,
    get() {
      deprecatedModule(`import { GL } from 'expo' -> import * as GL from 'expo-gl'`, 'GL', 'expo-gl');
      return require('expo-gl');
    },
  },

  GLView: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { GLView } from 'expo' -> import { GLView } from 'expo-gl'`,
        'GLView',
        'expo-gl'
      );
      return require('expo-gl').GLView;
    },
  },

  GoogleSignIn: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { GoogleSignIn } from 'expo' -> import * as GoogleSignIn from 'expo-google-sign-in'`,
        'GoogleSignIn',
        'expo-google-sign-in'
      );
      return require('expo-google-sign-in');
    },
  },

  Haptic: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Haptic } from 'expo' -> import * as Haptic from 'expo-haptics'`,
        'Haptic',
        'expo-haptics'
      );
      return require('expo-haptics');
    },
  },
  Haptics: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Haptics } from 'expo' -> import * as Haptics from 'expo-haptics'`,
        'Haptics',
        'expo-haptics'
      );
      return require('expo-haptics');
    },
  },

  ImageManipulator: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { ImageManipulator } from 'expo' -> import * as ImageManipulator from 'expo-image-manipulator'`,
        'ImageManipulator',
        'expo-image-manipulator'
      );
      return require('expo-image-manipulator');
    },
  },

  ImagePicker: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { ImagePicker } from 'expo' -> import * as ImagePicker from 'expo-image-picker'`,
        'ImagePicker',
        'expo-image-picker'
      );
      return require('expo-image-picker');
    },
  },

  IntentLauncher: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { IntentLauncher } from 'expo' -> import * as IntentLauncher from 'expo-intent-launcher'`,
        'IntentLauncher',
        'expo-intent-launcher'
      );
      return require('expo-intent-launcher');
    },
  },
  IntentLauncherAndroid: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { IntentLauncherAndroid } from 'expo' -> import * as IntentLauncherAndroid from 'expo-intent-launcher'`,
        'IntentLauncherAndroid',
        'expo-intent-launcher'
      );
      return require('expo-intent-launcher');
    },
  },

  KeepAwake: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { KeepAwake } from 'expo' -> import KeepAwake from 'expo-keep-awake'`,
        'KeepAwake',
        'expo-keep-awake'
      );
      return require('expo-keep-awake').default;
    },
  },

  LinearGradient: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { LinearGradient } from 'expo' -> import { LinearGradient } from 'expo-linear-gradient'`,
        'LinearGradient',
        'expo-linear-gradient'
      );
      return require('expo-linear-gradient').LinearGradient;
    },
  },

  LocalAuthentication: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { LocalAuthentication } from 'expo' -> import * as LocalAuthentication from 'expo-local-authentication'`,
        'LocalAuthentication',
        'expo-local-authentication'
      );
      return require('expo-local-authentication');
    },
  },

  Localization: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Localization } from 'expo' -> import * as Localization from 'expo-localization'`,
        'Localization',
        'expo-localization'
      );
      return require('expo-localization');
    },
  },

  Location: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Location } from 'expo' -> import * as Location from 'expo-location'`,
        'Location',
        'expo-location'
      );
      return require('expo-location');
    },
  },

  MailComposer: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { MailComposer } from 'expo' -> import * as MailComposer from 'expo-mail-composer'`,
        'MailComposer',
        'expo-mail-composer'
      );
      return require('expo-mail-composer');
    },
  },

  MediaLibrary: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { MediaLibrary } from 'expo' -> import * as MediaLibrary from 'expo-media-library'`,
        'MediaLibrary',
        'expo-media-library'
      );
      return require('expo-media-library');
    },
  },

  Permissions: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Permissions } from 'expo' -> import * as Permissions from 'expo-permissions'`,
        'Permissions',
        'expo-permissions'
      );
      return require('expo-permissions');
    },
  },

  Print: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Print } from 'expo' -> import * as Print from 'expo-print'`,
        'Print',
        'expo-print'
      );
      return require('expo-print');
    },
  },

  Random: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Random } from 'expo' -> import * as Random from 'expo-random'`,
        'Random',
        'expo-random'
      );
      return require('expo-random');
    },
  },

  SecureStore: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { SecureStore } from 'expo' -> import * as SecureStore from 'expo-secure-store'`,
        'SecureStore',
        'expo-secure-store'
      );
      return require('expo-secure-store');
    },
  },

  Accelerometer: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Accelerometer } from 'expo' -> import { Accelerometer } from 'expo-sensors'`,
        'Accelerometer',
        'expo-sensors'
      );
      return require('expo-sensors').Accelerometer;
    },
  },
  Barometer: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Barometer } from 'expo' -> import { Barometer } from 'expo-sensors'`,
        'Barometer',
        'expo-sensors'
      );
      return require('expo-sensors').Barometer;
    },
  },
  Gyroscope: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Gyroscope } from 'expo' -> import { Gyroscope } from 'expo-sensors'`,
        'Gyroscope',
        'expo-sensors'
      );
      return require('expo-sensors').Gyroscope;
    },
  },
  Magnetometer: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Magnetometer } from 'expo' -> import { Magnetometer } from 'expo-sensors'`,
        'Magnetometer',
        'expo-sensors'
      );
      return require('expo-sensors').Magnetometer;
    },
  },
  MagnetometerUncalibrated: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { MagnetometerUncalibrated } from 'expo' -> import { MagnetometerUncalibrated } from 'expo-sensors'`,
        'MagnetometerUncalibrated',
        'expo-sensors'
      );
      return require('expo-sensors').MagnetometerUncalibrated;
    },
  },
  Sensors: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Sensors } from 'expo' -> import * as Sensors from 'expo-sensors'`,
        'Sensors',
        'expo-sensors'
      );
      return require('expo-sensors');
    },
  },

  Sharing: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Sharing } from 'expo' -> import * as Sharing from 'expo-sharing'`,
        'Sharing',
        'expo-sharing'
      );
      return require('expo-sharing');
    },
  },

  SMS: {
    enumerable: true,
    get() {
      deprecatedModule(`import { SMS } from 'expo' -> import * as SMS from 'expo-sms'`, 'SMS', 'expo-sms');
      return require('expo-sms');
    },
  },

  Speech: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Speech } from 'expo' -> import * as Speech from 'expo-speech'`,
        'Speech',
        'expo-speech'
      );
      return require('expo-speech');
    },
  },

  SQLite: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { SQLite } from 'expo' -> import { SQLite } from 'expo-sqlite'`,
        'SQLite',
        'expo-sqlite'
      );
      return require('expo-sqlite').SQLite;
    },
  },

  TaskManager: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { TaskManager } from 'expo' -> import * as TaskManager from 'expo-task-manager'`,
        'TaskManager',
        'expo-task-manager'
      );
      return require('expo-task-manager');
    },
  },

  WebBrowser: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { WebBrowser } from 'expo' -> import * as WebBrowser from 'expo-web-browser'`,
        'WebBrowser',
        'expo-web-browser'
      );
      return require('expo-web-browser');
    },
  },

  // Vendored native modules

  GestureHandler: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { GestureHandler } from 'expo' -> import * as GestureHandler from 'react-native-gesture-handler'`,
        'GestureHandler',
        'react-native-gesture-handler'
      );
      return require('react-native-gesture-handler');
    },
  },

  MapView: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { MapView } from 'expo' -> import MapView from 'react-native-maps'`,
        'MapView',
        'react-native-maps'
      );
      return require('react-native-maps').default;
    },
  },

  Svg: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Svg } from 'expo' -> import * as Svg from 'react-native-svg'`,
        'Svg',
        'react-native-svg'
      );
      return require('./Svg').default;
    },
  },

  takeSnapshotAsync: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { takeSnapshotAsync } from 'expo' -> import { captureRef as takeSnapshotAsync } from 'react-native-view-shot'`,
        'takeSnapshotAsync',
        'react-native-view-shot'
      );
      return require('react-native-view-shot').captureRef;
    },
  },

  WebView: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { WebView } from 'expo' -> import { WebView } from 'react-native-webview'`,
        'WebView',
        'react-native-webview'
      );
      return require('./WebView').WebView;
    },
  },
});
