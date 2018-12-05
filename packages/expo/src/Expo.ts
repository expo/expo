import './environment/validate';
import './environment/logging';

// load expo-asset immediately to set a custom `source` transformer in React Native
import 'expo-asset/src/Asset';
// polyfill navigator.geolocation
import 'expo-location/src/Location';

import { Constants } from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

if (typeof Constants.manifest.env === 'object') {
  Object.assign(process.env, Constants.manifest.env);
}

export { AdMobBanner, AdMobInterstitial, AdMobRewarded, PublisherBanner } from 'expo-ads-admob';
export { Segment } from 'expo-analytics-segment';
export { Asset } from 'expo-asset';
export { AppAuth } from 'expo-app-auth';
export { BarCodeScanner } from 'expo-barcode-scanner';
export { Camera } from 'expo-camera';
export { Constants } from 'expo-constants';
export { Contacts } from 'expo-contacts';
export { FaceDetector } from 'expo-face-detector';
export { FileSystem } from 'expo-file-system';
import * as Font from 'expo-font';
export { Font };
export { GLView } from 'expo-gl';
export { GoogleSignIn } from 'expo-google-sign-in';
export { LocalAuthentication } from 'expo-local-authentication';
export { Localization } from 'expo-localization';
export { Location } from 'expo-location';
export { MediaLibrary } from 'expo-media-library';
export { Permissions } from 'expo-permissions';
export { Print } from 'expo-print';
export { Accelerometer, Gyroscope, Magnetometer, MagnetometerUncalibrated } from 'expo-sensors';
import * as SMS from 'expo-sms';
export { SMS };
import * as GestureHandler from 'react-native-gesture-handler';
export { GestureHandler };
export { default as MapView } from 'react-native-maps';

import * as AR from './AR';
export { AR };
export { default as Amplitude } from './Amplitude/Amplitude';
export { default as AuthSession } from './AuthSession';
import * as Brightness from './Brightness';
export { Brightness };
import * as Calendar from './Calendar';
export { Calendar };
export { default as DangerZone } from './DangerZone';
import * as DocumentPicker from './DocumentPicker';
export { DocumentPicker };
export { default as ErrorRecovery } from './ErrorRecovery/ErrorRecovery';
import * as Facebook from './Facebook/Facebook';
export { Facebook };
import * as Google from './Google/Google';
export { Google };
import * as Haptic from './Haptic/Haptic';
export { Haptic };
export { default as Icon } from './Icon';
import * as ImageManipulator from './ImageManipulator/ImageManipulator';
export { ImageManipulator };
import * as ImagePicker from './ImagePicker/ImagePicker';
export { ImagePicker };
import * as IntentLauncherAndroid from './IntentLauncherAndroid/IntentLauncherAndroid';
export { IntentLauncherAndroid };
export { default as KeepAwake } from './KeepAwake';
export { default as Linking } from './Linking';
import * as MailComposer from './MailComposer/MailComposer';
export { MailComposer };
export { default as Notifications } from './Notifications/Notifications';
export { default as SQLite } from './SQLite';
import * as ScreenOrientation from './ScreenOrientation/ScreenOrientation';
export { ScreenOrientation };
import * as SecureStore from './SecureStore/SecureStore';
export { SecureStore };
import * as Speech from './Speech';
export { Speech };
import * as StoreReview from './StoreReview/StoreReview';
export { StoreReview };
export { default as Svg } from './Svg';
import * as Updates from './Updates/Updates';
export { Updates };
import * as Util from './Util';
export { Util };
export { default as WebBrowser } from './WebBrowser/WebBrowser';
export { default as apisAreAvailable } from './apisAreAvailable';
export { default as takeSnapshotAsync } from './takeSnapshotAsync';
import * as Audio from './av/Audio';
export { Audio };
export { default as Video } from './av/Video';
export { default as BlurView } from './effects/BlurView';
export { default as LinearGradient } from './effects/LinearGradient';
import * as FacebookAds from './facebook-ads';
export { FacebookAds };
export { default as AppLoading } from './launch/AppLoading';
import * as SplashScreen from './launch/SplashScreen';
export { SplashScreen };
export { default as registerRootComponent } from './launch/registerRootComponent';
export { default as Logs } from './logs/Logs';

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
