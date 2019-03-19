import './Expo.fx';

import Constants from 'expo-constants';
import * as Amplitude from 'expo-analytics-amplitude';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Calendar from 'expo-calendar';
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
import { BlurView } from 'expo-blur';
import * as AR from './AR';
import * as Brightness from 'expo-brightness';
import * as FileSystem from 'expo-file-system';
import * as Google from './Google/Google';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import * as ImageManipulator from 'expo-image-manipulator';
import * as IntentLauncher from 'expo-intent-launcher';
import * as LocalAuthentication from 'expo-local-authentication';
import * as ScreenOrientation from './ScreenOrientation/ScreenOrientation';
import * as StoreReview from './StoreReview/StoreReview';
import * as Updates from './Updates/Updates';
import * as FacebookAds from 'expo-ads-facebook';
import * as SplashScreen from './launch/SplashScreen';
import * as Sensors from 'expo-sensors';
import * as WebBrowser from 'expo-web-browser';
export { AdMobBanner, AdMobInterstitial, AdMobRewarded, PublisherBanner } from 'expo-ads-admob';
import * as Segment from 'expo-analytics-segment';
export { Segment };
export { Asset } from 'expo-asset';
import * as AppAuth from 'expo-app-auth';
export { AppAuth };
export { BackgroundFetch };
export { BarCodeScanner } from 'expo-barcode-scanner';
export { Calendar };
export { Camera } from 'expo-camera';
export { Constants };
import * as Contacts from 'expo-contacts';
export { Contacts };
export { DocumentPicker };
import * as FaceDetector from 'expo-face-detector';
export { FaceDetector };
export { FileSystem };
export { Font };
import * as GL from 'expo-gl';
const GLView = GL.GLView;
export { GL, GLView };
import * as GoogleSignIn from 'expo-google-sign-in';
export { GoogleSignIn };
export { ImageManipulator };
export { Haptics };
import * as ImagePicker from 'expo-image-picker';
export { ImagePicker };
export { LocalAuthentication };
export { IntentLauncher };
import * as Localization from 'expo-localization';
export { Localization };
import * as Crypto from 'expo-crypto';
export { Crypto };
export { Location };
import * as MediaLibrary from 'expo-media-library';
export { MediaLibrary };
import * as Permissions from 'expo-permissions';
export { Permissions };
import * as Print from 'expo-print';
export { Print };
export { Sensors };
export { SQLite } from 'expo-sqlite';
export { SMS };
export { Speech };
export { TaskManager };
export { GestureHandler } from './GestureHandler';
export { default as MapView } from './Maps/MapView';
export { AR };
export { Amplitude };
export { default as AuthSession } from './AuthSession';
export { Brightness };
export { default as DangerZone } from './DangerZone';
export { default as ErrorRecovery } from './ErrorRecovery/ErrorRecovery';
export { Facebook };
export { Google };
import * as Random from 'expo-random';
export { default as Icon } from './Icon';
export { Random };
export { Sharing };
export { default as KeepAwake, activate, deactivate } from 'expo-keep-awake';
export { default as Linking } from './Linking/Linking';
export { MailComposer };
export { default as Notifications } from './Notifications/Notifications';
export { ScreenOrientation };
export { SecureStore };
export { StoreReview };
export { default as Svg } from './Svg';
export { Updates };
export { WebBrowser };
export { default as apisAreAvailable } from './apisAreAvailable';
export { default as takeSnapshotAsync } from './takeSnapshotAsync/takeSnapshotAsync';
export { Audio, Video };
export { BlurView };
export { LinearGradient } from 'expo-linear-gradient';
export { FacebookAds };
export { default as AppLoading } from './launch/AppLoading';
export { SplashScreen };
export { default as registerRootComponent } from './launch/registerRootComponent';
export { default as Logs } from './logs/Logs';
export { default as Pedometer } from './Pedometer';
export { WebView } from './WebView';

declare var module: any;

if (module && module.exports) {

  //@ts-ignore
  Object.defineProperties(module.exports, {
    // Accelerometer: {

    // },
    // Barometer: {

    // },
    // Gyroscope: {

    // },
    // Magnetometer: {

    // },
    // MagnetometerUncalibarted: {

    // }
    Haptic: {
      enumerable: false,
      get() {
        console.log('Module name `Haptic` is deprecated. Use `Haptics` instead. Expo.Haptic will be removed in SDK 34');
        return require('expo-haptics');
      },
    },
    IntentLauncherAndroid: {
      enumerable: true,
      get() {
        console.warn(`Module name 'IntentLauncherAndroid' is deprecated, use 'IntentLauncher' instead. Expo.IntentLauncherAndroid will be removed in SDK 34`);
        return require('expo-intent-launcher');
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
}
