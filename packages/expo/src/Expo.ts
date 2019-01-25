import './environment/validate';
import './environment/logging';

// load expo-asset immediately to set a custom `source` transformer in React Native
import 'expo-asset';

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as BackgroundFetch from 'expo-background-fetch';
import * as DocumentPicker from 'expo-document-picker';
import * as Font from 'expo-font';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import * as Speech from 'expo-speech';
import * as TaskManager from 'expo-task-manager';

import * as Facebook from 'expo-facebook';
import * as MailComposer from 'expo-mail-composer';
import * as SecureStore from 'expo-secure-store';
import { Audio, Video } from 'expo-av';
import { BlurView, VibrancyView } from 'expo-blur';
import * as AR from './AR';
import * as Brightness from './Brightness';
import * as Calendar from './Calendar';
import * as Google from './Google/Google';
import * as Haptic from './Haptic/Haptic';
import * as ImageManipulator from './ImageManipulator/ImageManipulator';
import * as ImagePicker from './ImagePicker/ImagePicker';
import * as IntentLauncherAndroid from './IntentLauncherAndroid/IntentLauncherAndroid';
import * as ScreenOrientation from './ScreenOrientation/ScreenOrientation';
import * as StoreReview from './StoreReview/StoreReview';
import * as Updates from './Updates/Updates';
import * as Util from './Util';
import * as FacebookAds from './facebook-ads';
import * as SplashScreen from './launch/SplashScreen';

if (typeof Constants.manifest.env === 'object') {
  Object.assign(process.env, Constants.manifest.env);
}

export { AdMobBanner, AdMobInterstitial, AdMobRewarded, PublisherBanner } from 'expo-ads-admob';
export { Segment } from 'expo-analytics-segment';
export { Asset } from 'expo-asset';
export { AppAuth } from 'expo-app-auth';
export { BackgroundFetch };
export { BarCodeScanner } from 'expo-barcode-scanner';
export { Camera } from 'expo-camera';
export { Constants };
export { Contacts } from 'expo-contacts';
export { DocumentPicker };
export { FaceDetector } from 'expo-face-detector';
export { FileSystem } from 'expo-file-system';
export { Font };
export { GLView } from 'expo-gl';
export { GoogleSignIn } from 'expo-google-sign-in';
export { LocalAuthentication } from 'expo-local-authentication';
export { Localization } from 'expo-localization';
export { Location };
export { MediaLibrary } from 'expo-media-library';
export { Permissions } from 'expo-permissions';
export { Print } from 'expo-print';
export { Accelerometer, Gyroscope, Magnetometer, MagnetometerUncalibrated } from 'expo-sensors';
export { SQLite } from 'expo-sqlite';
export { SMS };
export { Speech };
export { TaskManager };
export { GestureHandler } from './GestureHandler';
export { default as MapView } from './Maps/MapView';
export { AR };
export { default as Amplitude } from './Amplitude/Amplitude';
export { default as AuthSession } from './AuthSession';
export { Brightness };
export { Calendar };
export { default as DangerZone } from './DangerZone';
export { default as ErrorRecovery } from './ErrorRecovery/ErrorRecovery';
export { Facebook };
export { Google };
export { Haptic };
export { default as Icon } from './Icon';
export { ImageManipulator };
export { ImagePicker };
export { IntentLauncherAndroid };
export { default as KeepAwake, activate, deactivate } from 'expo-keep-awake';
export { default as Linking } from './Linking/Linking';
export { MailComposer };
export { default as Notifications } from './Notifications/Notifications';
export { ScreenOrientation };
export { SecureStore };
export { StoreReview };
export { default as Svg } from './Svg';
export { Updates };
export { Util };
export { default as WebBrowser } from './WebBrowser/WebBrowser';
export { default as apisAreAvailable } from './apisAreAvailable';
export { default as takeSnapshotAsync } from './takeSnapshotAsync';
export { Audio, Video };
export { BlurView, VibrancyView };
export { LinearGradient } from 'expo-linear-gradient';
export { FacebookAds };
export { default as AppLoading } from './launch/AppLoading';
export { SplashScreen };
export { default as registerRootComponent } from './launch/registerRootComponent';
export { default as Logs } from './logs/Logs';

// polyfill navigator.geolocation
Location.installWebGeolocationPolyfill();

// @ts-ignore
Object.defineProperties(exports, {
  // TODO: Unify the Pedometer module across platforms so we can export it normally
  Pedometer: {
    enumerable: true,
    get() {
      if (Platform.OS === 'android') {
        return require('./Pedometer');
      } else {
        return require('expo-sensors').Pedometer;
      }
    },
  },
});

if (global) {
  // @ts-ignore
  global.__exponent = module.exports;
  // @ts-ignore
  global.__expo = module.exports;
  // @ts-ignore
  global.Expo = module.exports;
}
