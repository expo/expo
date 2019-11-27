// Importing these modules from the 'expo' package was deprecated in SDK 33.
// Please import them from the each individual unimodule package instead.
import removedModule from './removedModule';
/* eslint-disable getter-return */
Object.defineProperties(module.exports, {
    AdMobBanner: {
        enumerable: true,
        get() {
            removedModule(`import { AdMobBanner } from 'expo' -> import { AdMobBanner } from 'expo-ads-admob'`, 'AdMobBanner', 'expo-ads-admob');
        },
    },
    AdMobInterstitial: {
        enumerable: true,
        get() {
            removedModule(`import { AdMobInterstitial } from 'expo' -> import { AdMobInterstitial } from 'expo-ads-admob'`, 'AdMobInterstitial', 'expo-ads-admob');
        },
    },
    AdMobRewarded: {
        enumerable: true,
        get() {
            removedModule(`import { AdMobRewarded } from 'expo' -> import { AdMobRewarded } from 'expo-ads-admob'`, 'AdMobRewarded', 'expo-ads-admob');
        },
    },
    Animated: {
        enumerable: true,
        get() {
            removedModule(`import { Animated } from 'expo' -> import Animated from 'react-native-reanimated'`, 'Animated', 'react-native-reanimated');
        },
    },
    Easing: {
        enumerable: true,
        get() {
            removedModule(`import { Easing } from 'expo' -> import { Easing } from 'react-native-reanimated'`, 'Easing', 'react-native-reanimated');
        },
    },
    Transition: {
        enumerable: true,
        get() {
            removedModule(`import { Transition } from 'expo' -> import { Transition } from 'react-native-reanimated'`, 'Transition', 'react-native-reanimated');
        },
    },
    Transitioning: {
        enumerable: true,
        get() {
            removedModule(`import { Transitioning } from 'expo' -> import { Transitioning } from 'react-native-reanimated'`, 'Transitioning', 'react-native-reanimated');
        },
    },
    PublisherBanner: {
        enumerable: true,
        get() {
            removedModule(`import { PublisherBanner } from 'expo' -> import { PublisherBanner } from 'expo-ads-admob'`, 'PublisherBanner', 'expo-ads-admob');
        },
    },
    FacebookAds: {
        enumerable: true,
        get() {
            removedModule(`import { FacebookAds } from 'expo' -> import * as FacebookAds from 'expo-ads-facebook'`, 'FacebookAds', 'expo-ads-facebook');
        },
    },
    Amplitude: {
        enumerable: true,
        get() {
            removedModule(`import { Amplitude } from 'expo' -> import * as Amplitude from 'expo-analytics-amplitude'`, 'Amplitude', 'expo-analytics-amplitude');
        },
    },
    Segment: {
        enumerable: true,
        get() {
            removedModule(`import { Segment } from 'expo' -> import * as Segment from 'expo-analytics-segment'`, 'Segment', 'expo-analytics-segment');
        },
    },
    AppAuth: {
        enumerable: true,
        get() {
            removedModule(`import { AppAuth } from 'expo' -> import * as AppAuth from 'expo-app-auth'`, 'AppAuth', 'expo-app-auth');
        },
    },
    Asset: {
        enumerable: true,
        get() {
            removedModule(`import { Asset } from 'expo' -> import { Asset } from 'expo-asset'`, 'Asset', 'expo-asset');
        },
    },
    Audio: {
        enumerable: true,
        get() {
            removedModule(`import { Audio } from 'expo' -> import { Audio } from 'expo-av'`, 'Audio', 'expo-av');
        },
    },
    Video: {
        enumerable: true,
        get() {
            removedModule(`import { Video } from 'expo' -> import { Video } from 'expo-av'`, 'Video', 'expo-av');
        },
    },
    BackgroundFetch: {
        enumerable: true,
        get() {
            removedModule(`import { BackgroundFetch } from 'expo' -> import * as BackgroundFetch from 'expo-background-fetch'`, 'BackgroundFetch', 'expo-background-fetch');
        },
    },
    BarCodeScanner: {
        enumerable: true,
        get() {
            removedModule(`import { BarCodeScanner } from 'expo' -> import { BarCodeScanner } from 'expo-barcode-scanner'`, 'BarCodeScanner', 'expo-barcode-scanner');
        },
    },
    BlurView: {
        enumerable: true,
        get() {
            removedModule(`import { BlurView } from 'expo' -> import { BlurView } from 'expo-blur'`, 'BlurView', 'expo-blur');
        },
    },
    Brightness: {
        enumerable: true,
        get() {
            removedModule(`import { Brightness } from 'expo' -> import * as Brightness from 'expo-brightness'`, 'Brightness', 'expo-brightness');
        },
    },
    Calendar: {
        enumerable: true,
        get() {
            removedModule(`import { Calendar } from 'expo' -> import * as Calendar from 'expo-calendar'`, 'Calendar', 'expo-calendar');
        },
    },
    Camera: {
        enumerable: true,
        get() {
            removedModule(`import { Camera } from 'expo' -> import { Camera } from 'expo-camera'`, 'Camera', 'expo-camera');
        },
    },
    Constants: {
        enumerable: true,
        get() {
            removedModule(`import { Constants } from 'expo' -> import Constants from 'expo-constants'`, 'Constants', 'expo-constants');
        },
    },
    Contacts: {
        enumerable: true,
        get() {
            removedModule(`import { Contacts } from 'expo' -> import * as Contacts from 'expo-contacts'`, 'Contacts', 'expo-contacts');
        },
    },
    Crypto: {
        enumerable: true,
        get() {
            removedModule(`import { Crypto } from 'expo' -> import * as Crypto from 'expo-crypto'`, 'Crypto', 'expo-crypto');
        },
    },
    DocumentPicker: {
        enumerable: true,
        get() {
            removedModule(`import { DocumentPicker } from 'expo' -> import * as DocumentPicker from 'expo-document-picker'`, 'DocumentPicker', 'expo-document-picker');
        },
    },
    ErrorRecovery: {
        enumerable: true,
        get() {
            removedModule(`import { ErrorRecovery } from 'expo' -> import * as ErrorRecovery from 'expo-error-recovery'`, 'ErrorRecovery', 'expo-error-recovery');
        },
    },
    FaceDetector: {
        enumerable: true,
        get() {
            removedModule(`import { FaceDetector } from 'expo' -> import * as FaceDetector from 'expo-face-detector'`, 'FaceDetector', 'expo-face-detector');
        },
    },
    Facebook: {
        enumerable: true,
        get() {
            removedModule(`import { Facebook } from 'expo' -> import * as Facebook from 'expo-facebook'`, 'Facebook', 'expo-facebook');
        },
    },
    FileSystem: {
        enumerable: true,
        get() {
            removedModule(`import { FileSystem } from 'expo' -> import * as FileSystem from 'expo-file-system'`, 'FileSystem', 'expo-file-system');
        },
    },
    Font: {
        enumerable: true,
        get() {
            removedModule(`import { Font } from 'expo' -> import * as Font from 'expo-font'`, 'Font', 'expo-font');
        },
    },
    GL: {
        enumerable: true,
        get() {
            removedModule(`import { GL } from 'expo' -> import * as GL from 'expo-gl'`, 'GL', 'expo-gl');
        },
    },
    GLView: {
        enumerable: true,
        get() {
            removedModule(`import { GLView } from 'expo' -> import { GLView } from 'expo-gl'`, 'GLView', 'expo-gl');
        },
    },
    GoogleSignIn: {
        enumerable: true,
        get() {
            removedModule(`import { GoogleSignIn } from 'expo' -> import * as GoogleSignIn from 'expo-google-sign-in'`, 'GoogleSignIn', 'expo-google-sign-in');
        },
    },
    Google: {
        enumerable: true,
        get() {
            removedModule(`import { Google } from 'expo' -> import * as Google from 'expo-google-app-auth'`, 'Google', 'expo-google-app-auth');
        },
    },
    Haptic: {
        enumerable: true,
        get() {
            removedModule(`import { Haptic } from 'expo' -> import * as Haptic from 'expo-haptics'`, 'Haptic', 'expo-haptics');
        },
    },
    Haptics: {
        enumerable: true,
        get() {
            removedModule(`import { Haptics } from 'expo' -> import * as Haptics from 'expo-haptics'`, 'Haptics', 'expo-haptics');
        },
    },
    ImageManipulator: {
        enumerable: true,
        get() {
            removedModule(`import { ImageManipulator } from 'expo' -> import * as ImageManipulator from 'expo-image-manipulator'`, 'ImageManipulator', 'expo-image-manipulator');
        },
    },
    ImagePicker: {
        enumerable: true,
        get() {
            removedModule(`import { ImagePicker } from 'expo' -> import * as ImagePicker from 'expo-image-picker'`, 'ImagePicker', 'expo-image-picker');
        },
    },
    IntentLauncher: {
        enumerable: true,
        get() {
            removedModule(`import { IntentLauncher } from 'expo' -> import * as IntentLauncher from 'expo-intent-launcher'`, 'IntentLauncher', 'expo-intent-launcher');
        },
    },
    IntentLauncherAndroid: {
        enumerable: true,
        get() {
            removedModule(`import { IntentLauncherAndroid } from 'expo' -> import * as IntentLauncherAndroid from 'expo-intent-launcher'`, 'IntentLauncherAndroid', 'expo-intent-launcher');
        },
    },
    KeepAwake: {
        enumerable: true,
        get() {
            removedModule(`import { KeepAwake } from 'expo' -> import KeepAwake from 'expo-keep-awake'`, 'KeepAwake', 'expo-keep-awake');
        },
    },
    LinearGradient: {
        enumerable: true,
        get() {
            removedModule(`import { LinearGradient } from 'expo' -> import { LinearGradient } from 'expo-linear-gradient'`, 'LinearGradient', 'expo-linear-gradient');
        },
    },
    LocalAuthentication: {
        enumerable: true,
        get() {
            removedModule(`import { LocalAuthentication } from 'expo' -> import * as LocalAuthentication from 'expo-local-authentication'`, 'LocalAuthentication', 'expo-local-authentication');
        },
    },
    Localization: {
        enumerable: true,
        get() {
            removedModule(`import { Localization } from 'expo' -> import * as Localization from 'expo-localization'`, 'Localization', 'expo-localization');
        },
    },
    Location: {
        enumerable: true,
        get() {
            removedModule(`import { Location } from 'expo' -> import * as Location from 'expo-location'`, 'Location', 'expo-location');
        },
    },
    MailComposer: {
        enumerable: true,
        get() {
            removedModule(`import { MailComposer } from 'expo' -> import * as MailComposer from 'expo-mail-composer'`, 'MailComposer', 'expo-mail-composer');
        },
    },
    MediaLibrary: {
        enumerable: true,
        get() {
            removedModule(`import { MediaLibrary } from 'expo' -> import * as MediaLibrary from 'expo-media-library'`, 'MediaLibrary', 'expo-media-library');
        },
    },
    Permissions: {
        enumerable: true,
        get() {
            removedModule(`import { Permissions } from 'expo' -> import * as Permissions from 'expo-permissions'`, 'Permissions', 'expo-permissions');
        },
    },
    Print: {
        enumerable: true,
        get() {
            removedModule(`import { Print } from 'expo' -> import * as Print from 'expo-print'`, 'Print', 'expo-print');
        },
    },
    Random: {
        enumerable: true,
        get() {
            removedModule(`import { Random } from 'expo' -> import * as Random from 'expo-random'`, 'Random', 'expo-random');
        },
    },
    SecureStore: {
        enumerable: true,
        get() {
            removedModule(`import { SecureStore } from 'expo' -> import * as SecureStore from 'expo-secure-store'`, 'SecureStore', 'expo-secure-store');
        },
    },
    Accelerometer: {
        enumerable: true,
        get() {
            removedModule(`import { Accelerometer } from 'expo' -> import { Accelerometer } from 'expo-sensors'`, 'Accelerometer', 'expo-sensors');
        },
    },
    Barometer: {
        enumerable: true,
        get() {
            removedModule(`import { Barometer } from 'expo' -> import { Barometer } from 'expo-sensors'`, 'Barometer', 'expo-sensors');
        },
    },
    Gyroscope: {
        enumerable: true,
        get() {
            removedModule(`import { Gyroscope } from 'expo' -> import { Gyroscope } from 'expo-sensors'`, 'Gyroscope', 'expo-sensors');
        },
    },
    Magnetometer: {
        enumerable: true,
        get() {
            removedModule(`import { Magnetometer } from 'expo' -> import { Magnetometer } from 'expo-sensors'`, 'Magnetometer', 'expo-sensors');
        },
    },
    MagnetometerUncalibrated: {
        enumerable: true,
        get() {
            removedModule(`import { MagnetometerUncalibrated } from 'expo' -> import { MagnetometerUncalibrated } from 'expo-sensors'`, 'MagnetometerUncalibrated', 'expo-sensors');
        },
    },
    Sensors: {
        enumerable: true,
        get() {
            removedModule(`import { Sensors } from 'expo' -> import * as Sensors from 'expo-sensors'`, 'Sensors', 'expo-sensors');
        },
    },
    Sharing: {
        enumerable: true,
        get() {
            removedModule(`import { Sharing } from 'expo' -> import * as Sharing from 'expo-sharing'`, 'Sharing', 'expo-sharing');
        },
    },
    SMS: {
        enumerable: true,
        get() {
            removedModule(`import { SMS } from 'expo' -> import * as SMS from 'expo-sms'`, 'SMS', 'expo-sms');
        },
    },
    Speech: {
        enumerable: true,
        get() {
            removedModule(`import { Speech } from 'expo' -> import * as Speech from 'expo-speech'`, 'Speech', 'expo-speech');
        },
    },
    SQLite: {
        enumerable: true,
        get() {
            removedModule(`import { SQLite } from 'expo' -> import { SQLite } from 'expo-sqlite'`, 'SQLite', 'expo-sqlite');
        },
    },
    StoreReview: {
        enumerable: true,
        get() {
            removedModule(`import { StoreReview } from 'expo' -> import { StoreReview } from 'expo-store-review'`, 'StoreReview', 'expo-store-review');
        },
    },
    TaskManager: {
        enumerable: true,
        get() {
            removedModule(`import { TaskManager } from 'expo' -> import * as TaskManager from 'expo-task-manager'`, 'TaskManager', 'expo-task-manager');
        },
    },
    WebBrowser: {
        enumerable: true,
        get() {
            removedModule(`import { WebBrowser } from 'expo' -> import * as WebBrowser from 'expo-web-browser'`, 'WebBrowser', 'expo-web-browser');
        },
    },
    // Vendored native modules
    GestureHandler: {
        enumerable: true,
        get() {
            removedModule(`import { GestureHandler } from 'expo' -> import * as GestureHandler from 'react-native-gesture-handler'`, 'GestureHandler', 'react-native-gesture-handler');
        },
    },
    Icon: {
        enumerable: true,
        get() {
            removedModule(`import { Icon } from 'expo' -> import * as Icon from '@expo/vector-icons'`, 'Icon', '@expo/vector-icons');
        },
    },
    MapView: {
        enumerable: true,
        get() {
            removedModule(`import { MapView } from 'expo' -> import MapView from 'react-native-maps'`, 'MapView', 'react-native-maps');
        },
    },
    Svg: {
        enumerable: true,
        get() {
            removedModule(`import { Svg } from 'expo' -> import * as Svg from 'react-native-svg'`, 'Svg', 'react-native-svg');
        },
    },
    takeSnapshotAsync: {
        enumerable: true,
        get() {
            removedModule(`import { takeSnapshotAsync } from 'expo' -> import { captureRef as takeSnapshotAsync } from 'react-native-view-shot'`, 'takeSnapshotAsync', 'react-native-view-shot');
        },
    },
    WebView: {
        enumerable: true,
        get() {
            removedModule(`import { WebView } from 'expo' -> import { WebView } from 'react-native-webview'`, 'WebView', 'react-native-webview');
        },
    },
});
//# sourceMappingURL=removed.js.map