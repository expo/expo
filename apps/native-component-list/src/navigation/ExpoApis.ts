import React from 'react';

function optionalRequire(requirer: () => { default: React.ComponentType }) {
  try {
    return requirer().default;
  } catch (e) {
    return null;
  }
}

const Accelerometer = optionalRequire(() => require('../screens/AccelerometerScreen'));
const ActionSheet = optionalRequire(() => require('../screens/ActionSheetScreen'));
const Alert = optionalRequire(() => require('../screens/AlertScreen'));
const AppAuth = optionalRequire(() => require('../screens/AppAuthScreen'));
const Appearance = optionalRequire(() => require('../screens/AppearanceScreen'));
const AppleAuthentication = optionalRequire(() => require('../screens/AppleAuthenticationScreen'));
const Audio = optionalRequire(() => require('../screens/AV/AudioScreen'));
const AuthSession = optionalRequire(() => require('../screens/AuthSession/AuthSessionScreen'));
const BackgroundFetch = optionalRequire(() => require('../screens/BackgroundFetchScreen'));
const Battery = optionalRequire(() => require('../screens/BatteryScreen'));
const Branch = optionalRequire(() => require('../screens/BranchScreen'));
const Brightness = optionalRequire(() => require('../screens/BrightnessScreen'));
const Calendars = optionalRequire(() => require('../screens/CalendarsScreen'));
const Clipboard = optionalRequire(() => require('../screens/ClipboardScreen'));
const Constants = optionalRequire(() => require('../screens/ConstantsScreen'));
const ContactDetail = optionalRequire(() => require('../screens/Contacts/ContactDetailScreen'));
const Contacts = optionalRequire(() => require('../screens/Contacts/ContactsScreen'));
const Device = optionalRequire(() => require('../screens/DeviceScreen'));
const DocumentPicker = optionalRequire(() => require('../screens/DocumentPickerScreen'));
const Events = optionalRequire(() => require('../screens/EventsScreen'));
const FacebookLogin = optionalRequire(() => require('../screens/FacebookLoginScreen'));
const FaceDetector = optionalRequire(() => require('../screens/FaceDetectorScreen'));
const FileSystem = optionalRequire(() => require('../screens/FileSystemScreen'));
const FirebaseRecaptcha = optionalRequire(() => require('../screens/FirebaseRecaptchaScreen'));
const Font = optionalRequire(() => require('../screens/FontScreen'));
const Google = optionalRequire(() => require('../screens/GoogleScreen'));
const GoogleSignIn = optionalRequire(() => require('../screens/GoogleSignInScreen'));
const Haptics = optionalRequire(() => require('../screens/HapticsScreen'));
const ImageManipulator = optionalRequire(() => require('../screens/ImageManipulatorScreen'));
const ImagePicker = optionalRequire(() => require('../screens/ImagePickerScreen'));
const InAppPurchases = optionalRequire(() => require('../screens/InAppPurchases/InAppPurchases'));
const IntentLauncher = optionalRequire(() => require('../screens/IntentLauncherScreen'));
const KeepAwake = optionalRequire(() => require('../screens/KeepAwakeScreen'));
const Linking = optionalRequire(() => require('../screens/LinkingScreen'));
const LocalAuthentication = optionalRequire(() => require('../screens/LocalAuthenticationScreen'));
const Localization = optionalRequire(() => require('../screens/LocalizationScreen'));
const LocationScreens = optionalRequire(() => require('../screens/Location/LocationScreens'));
const MailComposer = optionalRequire(() => require('../screens/MailComposerScreen'));
const MediaLibraryScreens = optionalRequire(() =>
  require('../screens/MediaLibrary/MediaLibraryScreens')
);
const NetInfo = optionalRequire(() => require('../screens/NetInfoScreen'));
const Notification = optionalRequire(() => require('../screens/NotificationScreen'));
const Pedometer = optionalRequire(() => require('../screens/PedometerScreen'));
const Permissions = optionalRequire(() => require('../screens/PermissionsScreen'));
const Print = optionalRequire(() => require('../screens/PrintScreen'));
const Random = optionalRequire(() => require('../screens/RandomScreen'));
const Recording = optionalRequire(() => require('../screens/AV/RecordingScreen'));
const Reminders = optionalRequire(() => require('../screens/RemindersScreen'));
const SafeAreaContext = optionalRequire(() => require('../screens/SafeAreaContextScreen'));
const ScreenOrientation = optionalRequire(() => require('../screens/ScreenOrientationScreen'));
const SecureStore = optionalRequire(() => require('../screens/SecureStoreScreen'));
const Sensor = optionalRequire(() => require('../screens/SensorScreen'));
const Sharing = optionalRequire(() => require('../screens/SharingScreen'));
const SMS = optionalRequire(() => require('../screens/SMSScreen'));
const StatusBar = optionalRequire(() => require('../screens/StatusBarScreen'));
const StoreReview = optionalRequire(() => require('../screens/StoreReview'));
const TaskManager = optionalRequire(() => require('../screens/TaskManagerScreen'));
const TextToSpeech = optionalRequire(() => require('../screens/TextToSpeechScreen'));
const ViewShot = optionalRequire(() => require('../screens/ViewShotScreen'));
const WebBrowser = optionalRequire(() => require('../screens/WebBrowserScreen'));

// @ts-ignore
const optionalScreens: {
  [key: string]: React.ComponentType | null;
} = {
  StatusBar,
  Alert,
  Clipboard,
  Accelerometer,
  ActionSheet,
  AppAuth,
  Appearance,
  AppleAuthentication,
  Audio,
  AuthSession,
  BackgroundFetch,
  Battery,
  Branch,
  Brightness,
  Device,
  DocumentPicker,
  Localization,
  FacebookLogin,
  FaceDetector,
  FileSystem,
  FirebaseRecaptcha,
  Font,
  Google,
  GoogleSignIn,
  Haptics,
  Calendars,
  Constants,
  Contacts,
  ContactDetail,
  Events,
  ImageManipulator,
  ImagePicker,
  InAppPurchases,
  IntentLauncher,
  KeepAwake,
  Linking,
  MailComposer,
  ...MediaLibraryScreens,
  NetInfo,
  Notification,
  LocalAuthentication,
  ...LocationScreens,
  Pedometer,
  Permissions,
  Print,
  Recording,
  Random,
  Reminders,
  SafeAreaContext,
  ScreenOrientation,
  SecureStore,
  Sensor,
  Sharing,
  SMS,
  StoreReview,
  TaskManager,
  TextToSpeech,
  WebBrowser,
  ViewShot,
};

type ScreensObjectType = Record<string, React.ComponentType>;
type RoutesObjectType = Record<string, string>;

export const Screens = Object.entries(optionalScreens).reduce<ScreensObjectType>(
  (acc, [key, screen]) => {
    if (screen) {
      acc[key] = screen;
    }
    return acc;
  },
  {}
);

export const Routes = Object.entries(Screens).reduce<RoutesObjectType>((acc, [key, screen]) => {
  acc[key] = key.toLowerCase();
  return acc;
}, {});
