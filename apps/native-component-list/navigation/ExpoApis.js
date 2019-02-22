import ActionSheet from '../screens/ActionSheetScreen';
import AppAuth from '../screens/AppAuthScreen';
import Audio from '../screens/AV/AudioScreen';
import AuthSession from '../screens/AuthSessionScreen';
import Branch from '../screens/BranchScreen';
import Calendars from '../screens/CalendarsScreen';
import Constants from '../screens/ConstantsScreen';
import ContactDetail from '../screens/Contacts/ContactDetailScreen';
import Contacts from '../screens/Contacts/ContactsScreen';
import DocumentPicker from '../screens/DocumentPickerScreen';
import Events from '../screens/EventsScreen';
import FacebookLogin from '../screens/FacebookLoginScreen';
import FileSystem from '../screens/FileSystemScreen';
import Font from '../screens/FontScreen';
import Geocoding from '../screens/GeocodingScreen';
import Google from '../screens/GoogleScreen';
import ImageManipulator from '../screens/ImageManipulatorScreen';
import ImagePicker from '../screens/ImagePickerScreen';
import IntentLauncher from '../screens/IntentLauncherScreen';
import KeepAwake from '../screens/KeepAwakeScreen';
import Linking from '../screens/LinkingScreen';
import LocalAuthentication from '../screens/LocalAuthenticationScreen';
import MailComposer from '../screens/MailComposerScreen';
import Notification from '../screens/NotificationScreen';
import Pedometer from '../screens/PedometerScreen';
import Permissions from '../screens/PermissionsScreen';
import Print from '../screens/PrintScreen';
import Recording from '../screens/AV/RecordingScreen';
import Reminders from '../screens/RemindersScreen';
import ScreenOrientation from '../screens/ScreenOrientationScreen';
import SecureStore from '../screens/SecureStoreScreen';
import SMS from '../screens/SMSScreen';
import StoreReview from '../screens/StoreReview';
import TextToSpeech from '../screens/TextToSpeechScreen';
import Util from '../screens/UtilScreen';
import ViewShot from '../screens/ViewShotScreen';
import WebBrowser from '../screens/WebBrowserScreen';

function optionalRequire(requirer) {
  try {
    return requirer().default;
  } catch (e) {
    return null;
  }
}

const BackgroundFetch = optionalRequire(() => require('../screens/BackgroundFetchScreen'));
const GoogleSignIn = optionalRequire(() => require('../screens/GoogleSignInScreen'));
const Haptics = optionalRequire(() => require('../screens/HapticsScreen'));
const Localization = optionalRequire(() => require('../screens/LocalizationScreen'));
const TaskManager = optionalRequire(() => require('../screens/TaskManagerScreen'));
const LocationScreens = optionalRequire(() => require('../screens/Location/LocationScreens'));
const MediaLibraryScreens = optionalRequire(() =>
  require('../screens/MediaLibrary/MediaLibraryScreens')
);
const Sensor = optionalRequire(() => require('../screens/SensorScreen'));

const optionalScreens = {
  ActionSheet,
  AppAuth,
  Audio,
  AuthSession,
  BackgroundFetch,
  Branch,
  DocumentPicker,
  Localization,
  FacebookLogin,
  FileSystem,
  Font,
  Google,
  GoogleSignIn,
  Haptics,
  Calendars,
  Constants,
  Contacts,
  ContactDetail,
  Events,
  Geocoding,
  ImageManipulator,
  ImagePicker,
  IntentLauncher,
  KeepAwake,
  Linking,
  MailComposer,
  ...MediaLibraryScreens,
  Notification,
  LocalAuthentication,
  ...LocationScreens,
  Pedometer,
  Permissions,
  Print,
  Recording,
  Reminders,
  ScreenOrientation,
  SecureStore,
  Sensor,
  SMS,
  StoreReview,
  TaskManager,
  TextToSpeech,
  Util,
  WebBrowser,
  ViewShot,
};

export const Screens = Object.keys(optionalScreens).reduce((acc, key) => {
  if (optionalScreens[key]) {
    acc[key] = optionalScreens[key];
  }
  return acc;
}, {});
