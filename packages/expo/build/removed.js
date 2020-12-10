// Importing these modules from the 'expo' package was deprecated in SDK 33.
// Please import them from the each individual unimodule package instead.
import removedModule from './removedModule';
/* eslint-disable getter-return */
Object.defineProperties(module.exports, {
    /** @deprecated */
    AdMobBanner: {
        enumerable: true,
        get() {
            removedModule(`import { AdMobBanner } from 'expo' -> import { AdMobBanner } from 'expo-ads-admob'`, 'AdMobBanner', 'expo-ads-admob');
        },
    },
    /** @deprecated */
    AdMobInterstitial: {
        enumerable: true,
        get() {
            removedModule(`import { AdMobInterstitial } from 'expo' -> import { AdMobInterstitial } from 'expo-ads-admob'`, 'AdMobInterstitial', 'expo-ads-admob');
        },
    },
    /** @deprecated */
    AdMobRewarded: {
        enumerable: true,
        get() {
            removedModule(`import { AdMobRewarded } from 'expo' -> import { AdMobRewarded } from 'expo-ads-admob'`, 'AdMobRewarded', 'expo-ads-admob');
        },
    },
    /** @deprecated */
    Animated: {
        enumerable: true,
        get() {
            removedModule(`import { Animated } from 'expo' -> import Animated from 'react-native-reanimated'`, 'Animated', 'react-native-reanimated');
        },
    },
    /** @deprecated */
    AR: {
        enumerable: true,
        get() {
            if (__DEV__) {
                setTimeout(() => {
                    throw new Error('The AR module has been removed from the Expo package. See https://expo.fyi/deprecating-ar for more information.');
                }, 1000);
            }
        },
    },
    /** @deprecated */
    AuthSession: {
        enumerable: true,
        get() {
            removedModule(`import { AuthSession } from 'expo' -> import * as AuthSession from 'expo-auth-session'`, 'AuthSession', 'expo-auth-session');
        },
    },
    /** @deprecated */
    Easing: {
        enumerable: true,
        get() {
            removedModule(`import { Easing } from 'expo' -> import { Easing } from 'react-native-reanimated'`, 'Easing', 'react-native-reanimated');
        },
    },
    /** @deprecated */
    Transition: {
        enumerable: true,
        get() {
            removedModule(`import { Transition } from 'expo' -> import { Transition } from 'react-native-reanimated'`, 'Transition', 'react-native-reanimated');
        },
    },
    /** @deprecated */
    Transitioning: {
        enumerable: true,
        get() {
            removedModule(`import { Transitioning } from 'expo' -> import { Transitioning } from 'react-native-reanimated'`, 'Transitioning', 'react-native-reanimated');
        },
    },
    /** @deprecated */
    PublisherBanner: {
        enumerable: true,
        get() {
            removedModule(`import { PublisherBanner } from 'expo' -> import { PublisherBanner } from 'expo-ads-admob'`, 'PublisherBanner', 'expo-ads-admob');
        },
    },
    /** @deprecated */
    FacebookAds: {
        enumerable: true,
        get() {
            removedModule(`import { FacebookAds } from 'expo' -> import * as FacebookAds from 'expo-ads-facebook'`, 'FacebookAds', 'expo-ads-facebook');
        },
    },
    /** @deprecated */
    Amplitude: {
        enumerable: true,
        get() {
            removedModule(`import { Amplitude } from 'expo' -> import * as Amplitude from 'expo-analytics-amplitude'`, 'Amplitude', 'expo-analytics-amplitude');
        },
    },
    /** @deprecated */
    Segment: {
        enumerable: true,
        get() {
            removedModule(`import { Segment } from 'expo' -> import * as Segment from 'expo-analytics-segment'`, 'Segment', 'expo-analytics-segment');
        },
    },
    /** @deprecated */
    AppAuth: {
        enumerable: true,
        get() {
            removedModule(`import { AppAuth } from 'expo' -> import * as AppAuth from 'expo-app-auth'`, 'AppAuth', 'expo-app-auth');
        },
    },
    /** @deprecated */
    AppLoading: {
        enumerable: true,
        get() {
            removedModule(`import { AppLoading } from 'expo' -> import AppLoading from 'expo-app-loading'`, 'AppLoading', 'expo-app-loading');
            const AppLoadingPlaceholder = require('./launch/AppLoadingPlaceholder');
            return AppLoadingPlaceholder.default;
        },
    },
    /** @deprecated */
    Asset: {
        enumerable: true,
        get() {
            removedModule(`import { Asset } from 'expo' -> import { Asset } from 'expo-asset'`, 'Asset', 'expo-asset');
        },
    },
    /** @deprecated */
    Audio: {
        enumerable: true,
        get() {
            removedModule(`import { Audio } from 'expo' -> import { Audio } from 'expo-av'`, 'Audio', 'expo-av');
        },
    },
    /** @deprecated */
    Video: {
        enumerable: true,
        get() {
            removedModule(`import { Video } from 'expo' -> import { Video } from 'expo-av'`, 'Video', 'expo-av');
        },
    },
    /** @deprecated */
    BackgroundFetch: {
        enumerable: true,
        get() {
            removedModule(`import { BackgroundFetch } from 'expo' -> import * as BackgroundFetch from 'expo-background-fetch'`, 'BackgroundFetch', 'expo-background-fetch');
        },
    },
    /** @deprecated */
    BarCodeScanner: {
        enumerable: true,
        get() {
            removedModule(`import { BarCodeScanner } from 'expo' -> import { BarCodeScanner } from 'expo-barcode-scanner'`, 'BarCodeScanner', 'expo-barcode-scanner');
        },
    },
    /** @deprecated */
    BlurView: {
        enumerable: true,
        get() {
            removedModule(`import { BlurView } from 'expo' -> import { BlurView } from 'expo-blur'`, 'BlurView', 'expo-blur');
        },
    },
    /** @deprecated */
    Brightness: {
        enumerable: true,
        get() {
            removedModule(`import { Brightness } from 'expo' -> import * as Brightness from 'expo-brightness'`, 'Brightness', 'expo-brightness');
        },
    },
    /** @deprecated */
    Calendar: {
        enumerable: true,
        get() {
            removedModule(`import { Calendar } from 'expo' -> import * as Calendar from 'expo-calendar'`, 'Calendar', 'expo-calendar');
        },
    },
    /** @deprecated */
    Camera: {
        enumerable: true,
        get() {
            removedModule(`import { Camera } from 'expo' -> import { Camera } from 'expo-camera'`, 'Camera', 'expo-camera');
        },
    },
    /** @deprecated */
    Constants: {
        enumerable: true,
        get() {
            removedModule(`import { Constants } from 'expo' -> import Constants from 'expo-constants'`, 'Constants', 'expo-constants');
        },
    },
    /** @deprecated */
    Contacts: {
        enumerable: true,
        get() {
            removedModule(`import { Contacts } from 'expo' -> import * as Contacts from 'expo-contacts'`, 'Contacts', 'expo-contacts');
        },
    },
    /** @deprecated */
    Crypto: {
        enumerable: true,
        get() {
            removedModule(`import { Crypto } from 'expo' -> import * as Crypto from 'expo-crypto'`, 'Crypto', 'expo-crypto');
        },
    },
    /** @deprecated */
    DocumentPicker: {
        enumerable: true,
        get() {
            removedModule(`import { DocumentPicker } from 'expo' -> import * as DocumentPicker from 'expo-document-picker'`, 'DocumentPicker', 'expo-document-picker');
        },
    },
    /** @deprecated */
    ErrorRecovery: {
        enumerable: true,
        get() {
            removedModule(`import { ErrorRecovery } from 'expo' -> import * as ErrorRecovery from 'expo-error-recovery'`, 'ErrorRecovery', 'expo-error-recovery');
        },
    },
    /** @deprecated */
    FaceDetector: {
        enumerable: true,
        get() {
            removedModule(`import { FaceDetector } from 'expo' -> import * as FaceDetector from 'expo-face-detector'`, 'FaceDetector', 'expo-face-detector');
        },
    },
    /** @deprecated */
    Facebook: {
        enumerable: true,
        get() {
            removedModule(`import { Facebook } from 'expo' -> import * as Facebook from 'expo-facebook'`, 'Facebook', 'expo-facebook');
        },
    },
    /** @deprecated */
    FileSystem: {
        enumerable: true,
        get() {
            removedModule(`import { FileSystem } from 'expo' -> import * as FileSystem from 'expo-file-system'`, 'FileSystem', 'expo-file-system');
        },
    },
    /** @deprecated */
    Font: {
        enumerable: true,
        get() {
            removedModule(`import { Font } from 'expo' -> import * as Font from 'expo-font'`, 'Font', 'expo-font');
        },
    },
    /** @deprecated */
    GL: {
        enumerable: true,
        get() {
            removedModule(`import { GL } from 'expo' -> import * as GL from 'expo-gl'`, 'GL', 'expo-gl');
        },
    },
    /** @deprecated */
    GLView: {
        enumerable: true,
        get() {
            removedModule(`import { GLView } from 'expo' -> import { GLView } from 'expo-gl'`, 'GLView', 'expo-gl');
        },
    },
    /** @deprecated */
    GoogleSignIn: {
        enumerable: true,
        get() {
            removedModule(`import { GoogleSignIn } from 'expo' -> import * as GoogleSignIn from 'expo-google-sign-in'`, 'GoogleSignIn', 'expo-google-sign-in');
        },
    },
    /** @deprecated */
    Google: {
        enumerable: true,
        get() {
            removedModule(`import { Google } from 'expo' -> import * as Google from 'expo-google-app-auth'`, 'Google', 'expo-google-app-auth');
        },
    },
    /** @deprecated */
    Haptic: {
        enumerable: true,
        get() {
            removedModule(`import { Haptic } from 'expo' -> import * as Haptic from 'expo-haptics'`, 'Haptic', 'expo-haptics');
        },
    },
    /** @deprecated */
    Haptics: {
        enumerable: true,
        get() {
            removedModule(`import { Haptics } from 'expo' -> import * as Haptics from 'expo-haptics'`, 'Haptics', 'expo-haptics');
        },
    },
    /** @deprecated */
    ImageManipulator: {
        enumerable: true,
        get() {
            removedModule(`import { ImageManipulator } from 'expo' -> import * as ImageManipulator from 'expo-image-manipulator'`, 'ImageManipulator', 'expo-image-manipulator');
        },
    },
    /** @deprecated */
    ImagePicker: {
        enumerable: true,
        get() {
            removedModule(`import { ImagePicker } from 'expo' -> import * as ImagePicker from 'expo-image-picker'`, 'ImagePicker', 'expo-image-picker');
        },
    },
    /** @deprecated */
    IntentLauncher: {
        enumerable: true,
        get() {
            removedModule(`import { IntentLauncher } from 'expo' -> import * as IntentLauncher from 'expo-intent-launcher'`, 'IntentLauncher', 'expo-intent-launcher');
        },
    },
    /** @deprecated */
    IntentLauncherAndroid: {
        enumerable: true,
        get() {
            removedModule(`import { IntentLauncherAndroid } from 'expo' -> import * as IntentLauncherAndroid from 'expo-intent-launcher'`, 'IntentLauncherAndroid', 'expo-intent-launcher');
        },
    },
    /** @deprecated */
    KeepAwake: {
        enumerable: true,
        get() {
            removedModule(`import { KeepAwake } from 'expo' -> import KeepAwake from 'expo-keep-awake'`, 'KeepAwake', 'expo-keep-awake');
        },
    },
    /** @deprecated */
    LinearGradient: {
        enumerable: true,
        get() {
            removedModule(`import { LinearGradient } from 'expo' -> import { LinearGradient } from 'expo-linear-gradient'`, 'LinearGradient', 'expo-linear-gradient');
        },
    },
    /** @deprecated */
    LocalAuthentication: {
        enumerable: true,
        get() {
            removedModule(`import { LocalAuthentication } from 'expo' -> import * as LocalAuthentication from 'expo-local-authentication'`, 'LocalAuthentication', 'expo-local-authentication');
        },
    },
    /** @deprecated */
    Localization: {
        enumerable: true,
        get() {
            removedModule(`import { Localization } from 'expo' -> import * as Localization from 'expo-localization'`, 'Localization', 'expo-localization');
        },
    },
    /** @deprecated */
    Location: {
        enumerable: true,
        get() {
            removedModule(`import { Location } from 'expo' -> import * as Location from 'expo-location'`, 'Location', 'expo-location');
        },
    },
    /** @deprecated */
    MailComposer: {
        enumerable: true,
        get() {
            removedModule(`import { MailComposer } from 'expo' -> import * as MailComposer from 'expo-mail-composer'`, 'MailComposer', 'expo-mail-composer');
        },
    },
    /** @deprecated */
    MediaLibrary: {
        enumerable: true,
        get() {
            removedModule(`import { MediaLibrary } from 'expo' -> import * as MediaLibrary from 'expo-media-library'`, 'MediaLibrary', 'expo-media-library');
        },
    },
    /** @deprecated */
    Permissions: {
        enumerable: true,
        get() {
            removedModule(`import { Permissions } from 'expo' -> import * as Permissions from 'expo-permissions'`, 'Permissions', 'expo-permissions');
        },
    },
    /** @deprecated */
    Print: {
        enumerable: true,
        get() {
            removedModule(`import { Print } from 'expo' -> import * as Print from 'expo-print'`, 'Print', 'expo-print');
        },
    },
    /** @deprecated */
    Random: {
        enumerable: true,
        get() {
            removedModule(`import { Random } from 'expo' -> import * as Random from 'expo-random'`, 'Random', 'expo-random');
        },
    },
    /** @deprecated */
    ScreenOrientation: {
        enumerable: true,
        get() {
            removedModule(`import { ScreenOrientation } from 'expo' -> import * as ScreenOrientation from 'expo-screen-orientation'`, 'ScreenOrientation', 'expo-screen-orientation');
        },
    },
    /** @deprecated */
    SecureStore: {
        enumerable: true,
        get() {
            removedModule(`import { SecureStore } from 'expo' -> import * as SecureStore from 'expo-secure-store'`, 'SecureStore', 'expo-secure-store');
        },
    },
    /** @deprecated */
    Accelerometer: {
        enumerable: true,
        get() {
            removedModule(`import { Accelerometer } from 'expo' -> import { Accelerometer } from 'expo-sensors'`, 'Accelerometer', 'expo-sensors');
        },
    },
    /** @deprecated */
    Barometer: {
        enumerable: true,
        get() {
            removedModule(`import { Barometer } from 'expo' -> import { Barometer } from 'expo-sensors'`, 'Barometer', 'expo-sensors');
        },
    },
    /** @deprecated */
    Gyroscope: {
        enumerable: true,
        get() {
            removedModule(`import { Gyroscope } from 'expo' -> import { Gyroscope } from 'expo-sensors'`, 'Gyroscope', 'expo-sensors');
        },
    },
    /** @deprecated */
    Magnetometer: {
        enumerable: true,
        get() {
            removedModule(`import { Magnetometer } from 'expo' -> import { Magnetometer } from 'expo-sensors'`, 'Magnetometer', 'expo-sensors');
        },
    },
    /** @deprecated */
    MagnetometerUncalibrated: {
        enumerable: true,
        get() {
            removedModule(`import { MagnetometerUncalibrated } from 'expo' -> import { MagnetometerUncalibrated } from 'expo-sensors'`, 'MagnetometerUncalibrated', 'expo-sensors');
        },
    },
    /** @deprecated */
    Pedometer: {
        enumerable: true,
        get() {
            removedModule(`import { Pedometer } from 'expo' -> import { Pedometer } from 'expo-sensors'`, 'Pedometer', 'expo-sensors');
        },
    },
    /** @deprecated */
    Sensors: {
        enumerable: true,
        get() {
            removedModule(`import { Sensors } from 'expo' -> import * as Sensors from 'expo-sensors'`, 'Sensors', 'expo-sensors');
        },
    },
    /** @deprecated */
    Sharing: {
        enumerable: true,
        get() {
            removedModule(`import { Sharing } from 'expo' -> import * as Sharing from 'expo-sharing'`, 'Sharing', 'expo-sharing');
        },
    },
    /** @deprecated */
    SMS: {
        enumerable: true,
        get() {
            removedModule(`import { SMS } from 'expo' -> import * as SMS from 'expo-sms'`, 'SMS', 'expo-sms');
        },
    },
    /** @deprecated */
    Speech: {
        enumerable: true,
        get() {
            removedModule(`import { Speech } from 'expo' -> import * as Speech from 'expo-speech'`, 'Speech', 'expo-speech');
        },
    },
    /** @deprecated */
    SplashScreen: {
        enumerable: true,
        get() {
            removedModule(`import { SplashScreen } from 'expo' -> import * as SplashScreen from 'expo-splash-screen'`, 'SplashScreen', 'expo-splash-screen');
        },
    },
    /** @deprecated */
    SQLite: {
        enumerable: true,
        get() {
            removedModule(`import { SQLite } from 'expo' -> import { SQLite } from 'expo-sqlite'`, 'SQLite', 'expo-sqlite');
        },
    },
    /** @deprecated */
    StoreReview: {
        enumerable: true,
        get() {
            removedModule(`import { StoreReview } from 'expo' -> import { StoreReview } from 'expo-store-review'`, 'StoreReview', 'expo-store-review');
        },
    },
    /** @deprecated */
    TaskManager: {
        enumerable: true,
        get() {
            removedModule(`import { TaskManager } from 'expo' -> import * as TaskManager from 'expo-task-manager'`, 'TaskManager', 'expo-task-manager');
        },
    },
    /** @deprecated */
    Updates: {
        enumerable: true,
        get() {
            removedModule(`import { Updates } from 'expo' -> import * as Updates from 'expo-updates'`, 'Updates', 'expo-updates');
        },
    },
    /** @deprecated */
    WebBrowser: {
        enumerable: true,
        get() {
            removedModule(`import { WebBrowser } from 'expo' -> import * as WebBrowser from 'expo-web-browser'`, 'WebBrowser', 'expo-web-browser');
        },
    },
    // Vendored native modules
    /** @deprecated */
    GestureHandler: {
        enumerable: true,
        get() {
            removedModule(`import { GestureHandler } from 'expo' -> import * as GestureHandler from 'react-native-gesture-handler'`, 'GestureHandler', 'react-native-gesture-handler');
        },
    },
    /** @deprecated */
    Icon: {
        enumerable: true,
        get() {
            removedModule(`import { Icon } from 'expo' -> import * as Icon from '@expo/vector-icons'`, 'Icon', '@expo/vector-icons');
        },
    },
    /** @deprecated */
    MapView: {
        enumerable: true,
        get() {
            removedModule(`import { MapView } from 'expo' -> import MapView from 'react-native-maps'`, 'MapView', 'react-native-maps');
        },
    },
    /** @deprecated */
    Svg: {
        enumerable: true,
        get() {
            removedModule(`import { Svg } from 'expo' -> import * as Svg from 'react-native-svg'`, 'Svg', 'react-native-svg');
        },
    },
    /** @deprecated */
    takeSnapshotAsync: {
        enumerable: true,
        get() {
            removedModule(`import { takeSnapshotAsync } from 'expo' -> import { captureRef as takeSnapshotAsync } from 'react-native-view-shot'`, 'takeSnapshotAsync', 'react-native-view-shot');
        },
    },
    /** @deprecated */
    WebView: {
        enumerable: true,
        get() {
            removedModule(`import { WebView } from 'expo' -> import { WebView } from 'react-native-webview'`, 'WebView', 'react-native-webview');
        },
    },
});
//# sourceMappingURL=removed.js.map