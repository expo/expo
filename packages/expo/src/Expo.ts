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
import * as AV from 'expo-av';
import { BlurView } from 'expo-blur';
import * as Brightness from 'expo-brightness';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import * as ImageManipulator from 'expo-image-manipulator';
import * as IntentLauncher from 'expo-intent-launcher';
import * as LocalAuthentication from 'expo-local-authentication';
import * as FacebookAds from 'expo-ads-facebook';
import * as Sensors from 'expo-sensors';
import * as WebBrowser from 'expo-web-browser';
import * as Segment from 'expo-analytics-segment';
import * as AppAuth from 'expo-app-auth';
import * as Contacts from 'expo-contacts';
import * as FaceDetector from 'expo-face-detector';
import * as GL from 'expo-gl';
import * as GoogleSignIn from 'expo-google-sign-in';
import * as ImagePicker from 'expo-image-picker';
import * as Localization from 'expo-localization';
import * as Crypto from 'expo-crypto';
import * as MediaLibrary from 'expo-media-library';
import * as Permissions from 'expo-permissions';
import * as Print from 'expo-print';
import * as GestureHandler from 'react-native-gesture-handler';
import * as Random from 'expo-random';
import * as Icon from '@expo/vector-icons';
import * as ErrorRecovery from './ErrorRecovery/ErrorRecovery';
import * as SplashScreen from './launch/SplashScreen';
import * as Updates from './Updates/Updates';
import * as StoreReview from './StoreReview/StoreReview';
import * as ScreenOrientation from './ScreenOrientation/ScreenOrientation';
import * as Google from './Google';
import * as AR from './AR';
export { AdMobBanner, AdMobInterstitial, AdMobRewarded, PublisherBanner } from 'expo-ads-admob';
export { Segment };
export { Asset } from 'expo-asset';
export { AppAuth };
export { BackgroundFetch };
export { BarCodeScanner } from 'expo-barcode-scanner';
export { Calendar };
export { Camera } from 'expo-camera';
export { Constants };
export { Contacts };
export { DocumentPicker };
export { FaceDetector };
export { FileSystem };
export { Font };
const GLView = GL.GLView;
export { GL, GLView };
export { GoogleSignIn };
export { ImageManipulator };
export { Haptics };
export { ImagePicker };
export { LocalAuthentication };
export { IntentLauncher };
export { Localization };
export { Crypto };
export { Location };
export { MediaLibrary };
export { Permissions };
export { Print };
export { Sensors };
export { SQLite } from 'expo-sqlite';
export { SMS };
export { Speech };
export { TaskManager };
export { GestureHandler };
export { default as MapView } from './Maps/MapView';
export { AR };
export { Amplitude };
export { default as AuthSession } from './AuthSession';
export { Brightness };
export { default as DangerZone } from './DangerZone';
export { ErrorRecovery };
export { Facebook };
export { Google };
export { Icon };
export { Random };
export { Sharing };
export { default as KeepAwake, activate, deactivate } from 'expo-keep-awake';
export { default as Linking } from './Linking/Linking';
export { MailComposer };
export { default as Notifications } from './Notifications/Notifications';
export { default as Animated, Easing, Transitioning, Transition } from './Animated';
export { ScreenOrientation };
export { SecureStore };
export { StoreReview };
export { default as Svg } from './Svg';
export { Updates };
export { WebBrowser };
export { default as apisAreAvailable } from './apisAreAvailable';
export { default as takeSnapshotAsync } from './takeSnapshotAsync/takeSnapshotAsync';
const { Audio, Video } = AV;
export { AV, Audio, Video };
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
        console.log(
          'Module name `Haptic` is deprecated. Use `Haptics` instead. Expo.Haptic will be removed in SDK 34'
        );
        return require('expo-haptics');
      },
    },
    IntentLauncherAndroid: {
      enumerable: true,
      get() {
        console.warn(
          `Module name 'IntentLauncherAndroid' is deprecated, use 'IntentLauncher' instead. Expo.IntentLauncherAndroid will be removed in SDK 34`
        );
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
