import AppAuth from '../screens/AppAuthScreen';
import AuthSession from '../screens/AuthSessionScreen';
import BackgroundFetch from '../screens/BackgroundFetchScreen';
import Branch from '../screens/BranchScreen';
import Calendars from '../screens/CalendarsScreen';
import Constants from '../screens/ConstantsScreen';
import ContactDetail from '../screens/Contacts/ContactDetailScreen';
import Contacts from '../screens/Contacts/ContactsScreen';
import DocumentPicker from '../screens/DocumentPickerScreen';
import Events from '../screens/EventsScreen';
import ExpoApis from '../screens/ExpoApisScreen';
import FacebookLogin from '../screens/FacebookLoginScreen';
import FileSystem from '../screens/FileSystemScreen';
import Font from '../screens/FontScreen';
import Geocoding from '../screens/GeocodingScreen';
import Google from '../screens/GoogleScreen';
import GoogleSignIn from '../screens/GoogleSignInScreen';
import Haptic from '../screens/HapticScreen';
import ImageManipulator from '../screens/ImageManipulatorScreen';
import ImagePicker from '../screens/ImagePickerScreen';
import IntentLauncher from '../screens/IntentLauncherScreen';
import KeepAwake from '../screens/KeepAwakeScreen';
import LocalAuthentication from '../screens/LocalAuthenticationScreen';
import Localization from '../screens/LocalizationScreen';
import LocationScreens from '../screens/Location/LocationScreens';
import MailComposer from '../screens/MailComposerScreen';
import MediaLibraryScreens from '../screens/MediaLibrary/MediaLibraryScreens';
import Notification from '../screens/NotificationScreen';
import Pedometer from '../screens/PedometerScreen';
import Permissions from '../screens/PermissionsScreen';
import Print from '../screens/PrintScreen';
import Reminders from '../screens/RemindersScreen';
import ScreenOrientation from '../screens/ScreenOrientationScreen';
import SecureStore from '../screens/SecureStoreScreen';
import Sensor from '../screens/SensorScreen';
import SMS from '../screens/SMSScreen';
import StoreReview from '../screens/StoreReview';
import TaskManager from '../screens/TaskManagerScreen';
import TextToSpeech from '../screens/TextToSpeechScreen';
import Util from '../screens/UtilScreen';
import ViewShot from '../screens/ViewShotScreen';
import WebBrowser from '../screens/WebBrowserScreen';
import createStackNavigator from './createStackNavigator';
import StackConfig from './StackConfig';

const ExpoApisStackNavigator = createStackNavigator(
  {
    ExpoApis,
    AppAuth,
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
    Haptic,
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
    MailComposer,
    ...MediaLibraryScreens,
    Notification,
    LocalAuthentication,
    ...LocationScreens,
    Pedometer,
    Permissions,
    Print,
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
  },
  StackConfig
);

export default ExpoApisStackNavigator;
