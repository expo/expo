import { Platform } from 'react-native';
import ActionSheet from '../screens/ActionSheetScreen';
// import AppAuth from '../screens/AppAuthScreen';
import Audio from '../screens/AV/AudioScreen';
// import AuthSession from '../screens/AuthSessionScreen';
// import Branch from '../screens/BranchScreen';
// import Calendars from '../screens/CalendarsScreen';
import Constants from '../screens/ConstantsScreen';
// import ContactDetail from '../screens/Contacts/ContactDetailScreen';
// import Contacts from '../screens/Contacts/ContactsScreen';
import DocumentPicker from '../screens/DocumentPickerScreen';
// import Events from '../screens/EventsScreen';
// import FacebookLogin from '../screens/FacebookLoginScreen';
// import FileSystem from '../screens/FileSystemScreen';
import Font from '../screens/FontScreen';
import Geocoding from '../screens/GeocodingScreen';
// import Google from '../screens/GoogleScreen';
import ImageManipulator from '../screens/ImageManipulatorScreen';
import ImagePicker from '../screens/ImagePickerScreen';
// import IntentLauncher from '../screens/IntentLauncherScreen';
// import KeepAwake from '../screens/KeepAwakeScreen';
import Linking from '../screens/LinkingScreen';
// import LocalAuthentication from '../screens/LocalAuthenticationScreen';
import MailComposer from '../screens/MailComposerScreen';
// import Notification from '../screens/NotificationScreen';
// import Pedometer from '../screens/PedometerScreen';
import Permissions from '../screens/PermissionsScreen';
import Print from '../screens/PrintScreen';
import Recording from '../screens/AV/RecordingScreen';
// import Reminders from '../screens/RemindersScreen';
import ScreenOrientation from '../screens/ScreenOrientationScreen';
import Sharing from '../screens/SharingScreen';
import SecureStore from '../screens/SecureStoreScreen';
import SMS from '../screens/SMSScreen';
// import StoreReview from '../screens/StoreReview';
import TextToSpeech from '../screens/TextToSpeechScreen';
import ViewShot from '../screens/ViewShotScreen';
// import WebBrowser from '../screens/WebBrowserScreen';

function optionalRequire(requirer) {
  try {
    return requirer().default;
  } catch (e) {
    return null;
  }
}

// const BackgroundFetch = optionalRequire(() => require('../screens/BackgroundFetchScreen'));
// const GoogleSignIn = optionalRequire(() => require('../screens/GoogleSignInScreen'));
// const Haptics = optionalRequire(() => require('../screens/HapticsScreen'));
const Localization = optionalRequire(() => require('../screens/LocalizationScreen'));
// const TaskManager = optionalRequire(() => require('../screens/TaskManagerScreen'));
const LocationScreens = optionalRequire(() => require('../screens/Location/LocationScreens'));
const MediaLibraryScreens = optionalRequire(() =>
  require('../screens/MediaLibrary/MediaLibraryScreens')
);
const Sensor = optionalRequire(() => require('../screens/SensorScreen'));
const Accelerometer = optionalRequire(() => require('../screens/AccelerometerScreen'));

const disabledOnWeb = (module, predicate = () => false) => {
  if (Platform.OS === 'web' && !predicate()) {
    return undefined;
  }
  return module;
};

const ShimView = () => null;

const AppAuth = ShimView;
const AuthSession = ShimView;
const BackgroundFetch = ShimView;
const Branch = ShimView;
const FacebookLogin = ShimView;
const FileSystem = ShimView;
const Google = ShimView;
const GoogleSignIn = ShimView;
const Haptics = ShimView;
const Calendars = ShimView;
const Contacts = ShimView;
const ContactDetail = ShimView;
const Events = ShimView;
const IntentLauncher = ShimView;
const KeepAwake = ShimView;
const Notification = ShimView;
const LocalAuthentication = ShimView;
const Pedometer = ShimView;
const Reminders = ShimView;
const StoreReview = ShimView;
const TaskManager = ShimView;
const WebBrowser = ShimView;

let optionalScreens = {
  Accelerometer,
  ActionSheet,
  Audio,
  AppAuth: disabledOnWeb(AppAuth),
  AuthSession: disabledOnWeb(AuthSession),
  BackgroundFetch: disabledOnWeb(BackgroundFetch),
  Branch: disabledOnWeb(Branch),
  DocumentPicker,
  Localization,
  FacebookLogin: disabledOnWeb(FacebookLogin),
  FileSystem: disabledOnWeb(FileSystem),
  Font,
  Google: disabledOnWeb(Google),
  GoogleSignIn: disabledOnWeb(GoogleSignIn),
  Haptics: disabledOnWeb(Haptics),
  Calendars: disabledOnWeb(Calendars),
  Constants,
  Contacts: disabledOnWeb(Contacts),
  ContactDetail: disabledOnWeb(ContactDetail),
  Events: disabledOnWeb(Events),
  Geocoding,
  ImageManipulator,
  ImagePicker,
  IntentLauncher: disabledOnWeb(IntentLauncher),
  KeepAwake: disabledOnWeb(KeepAwake),
  Linking,
  MailComposer,
  Notification: disabledOnWeb(Notification),
  LocalAuthentication: disabledOnWeb(LocalAuthentication),
  ...LocationScreens,
  Pedometer: disabledOnWeb(Pedometer),
  Permissions,
  Print,
  Recording,
  Reminders: disabledOnWeb(Reminders),
  ScreenOrientation,
  SecureStore,
  Sensor,
  Sharing: disabledOnWeb(Sharing, () => navigator.share),
  SMS,
  StoreReview: disabledOnWeb(StoreReview),
  TaskManager: disabledOnWeb(TaskManager),
  TextToSpeech,
  WebBrowser: disabledOnWeb(WebBrowser),
  ViewShot,
};

if (Platform.OS !== 'web') {
  optionalScreens = {
    ...optionalScreens,
    ...MediaLibraryScreens,
  };
}

export const Screens = Object.keys(optionalScreens).reduce((acc, key) => {
  if (optionalScreens[key]) {
    acc[key] = optionalScreens[key];
  }
  return acc;
}, {});
