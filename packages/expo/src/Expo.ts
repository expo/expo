import './Expo.fx';

import * as AR from './AR';
import * as ErrorRecovery from './ErrorRecovery/ErrorRecovery';
import * as Google from './Google';
import * as Logs from './logs/Logs';
import * as ScreenOrientation from './ScreenOrientation/ScreenOrientation';
import * as StoreReview from './StoreReview/StoreReview';
import * as Updates from './Updates/Updates';
import * as SplashScreen from './launch/SplashScreen';

export { AR };
export { ErrorRecovery };
export { Google };
export { Logs };
export { ScreenOrientation };
export { SplashScreen };
export { StoreReview };
export { Updates };

export { default as apisAreAvailable } from './apisAreAvailable';
export { default as AppLoading } from './launch/AppLoading';
export { default as AuthSession } from './AuthSession';
export { default as DangerZone } from './DangerZone';
export { default as Linking } from './Linking/Linking';
export { default as Notifications } from './Notifications/Notifications';
export { default as Pedometer } from './Pedometer';
export { default as registerRootComponent } from './launch/registerRootComponent';

// @ts-ignore
export {
  // @ts-ignore
  Accelerometer,
  // @ts-ignore
  AdMobBanner,
  // @ts-ignore
  AdMobInterstitial,
  // @ts-ignore
  AdMobRewarded,
  // @ts-ignore
  Animated,
  // @ts-ignore
  Amplitude,
  // @ts-ignore
  AppAuth,
  // @ts-ignore
  Asset,
  // @ts-ignore
  Audio,
  // @ts-ignore
  BackgroundFetch,
  // @ts-ignore
  BarCodeScanner,
  // @ts-ignore
  Barometer,
  // @ts-ignore
  BlurView,
  // @ts-ignore
  Brightness,
  // @ts-ignore
  Calendar,
  // @ts-ignore
  Camera,
  // @ts-ignore
  Constants,
  // @ts-ignore
  Contacts,
  // @ts-ignore
  Crypto,
  // @ts-ignore
  DocumentPicker,
  // @ts-ignore
  Easing,
  // @ts-ignore
  Facebook,
  // @ts-ignore
  FacebookAds,
  // @ts-ignore
  FaceDetector,
  // @ts-ignore
  FileSystem,
  // @ts-ignore
  Font,
  // @ts-ignore
  GestureHandler,
  // @ts-ignore
  GL,
  // @ts-ignore
  GLView,
  // @ts-ignore
  GoogleSignIn,
  // @ts-ignore
  Gyroscope,
  // @ts-ignore
  Haptic,
  // @ts-ignore
  Haptics,
  // @ts-ignore
  Icon,
  // @ts-ignore
  ImageManipulator,
  // @ts-ignore
  ImagePicker,
  // @ts-ignore
  IntentLauncher,
  // @ts-ignore
  IntentLauncherAndroid,
  // @ts-ignore
  KeepAwake,
  // @ts-ignore
  LinearGradient,
  // @ts-ignore
  LocalAuthentication,
  // @ts-ignore
  Localization,
  // @ts-ignore
  Location,
  // @ts-ignore
  Magnetometer,
  // @ts-ignore
  MagnetometerUncalibrated,
  // @ts-ignore
  MailComposer,
  // @ts-ignore
  MapView,
  // @ts-ignore
  MediaLibrary,
  // @ts-ignore
  Permissions,
  // @ts-ignore
  Print,
  // @ts-ignore
  PublisherBanner,
  // @ts-ignore
  Random,
  // @ts-ignore
  SecureStore,
  // @ts-ignore
  Segment,
  // @ts-ignore
  Sensors,
  // @ts-ignore
  Sharing,
  // @ts-ignore
  SMS,
  // @ts-ignore
  Speech,
  // @ts-ignore
  SQLite,
  // @ts-ignore
  Svg,
  // @ts-ignore
  takeSnapshotAsync,
  // @ts-ignore
  TaskManager,
  // @ts-ignore
  Transition,
  // @ts-ignore
  Transitioning,
  // @ts-ignore
  Video,
  // @ts-ignore
  WebBrowser,
  // @ts-ignore
  WebView,
} from './deprecated';

declare var module: any;

if (module && module.exports) {
  if (global) {
    // @ts-ignore
    global.__exponent = module.exports;
    // @ts-ignore
    global.__expo = module.exports;
    // @ts-ignore
    global.Expo = module.exports;
  }
}
