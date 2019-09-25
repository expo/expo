import React from 'react';

import ActionSheet from '../screens/ActionSheetScreen';
import AppAuth from '../screens/AppAuthScreen';
import Audio from '../screens/AV/AudioScreen';
import AuthSession from '../screens/AuthSessionScreen';
import Battery from '../screens/BatteryScreen';
import Branch from '../screens/BranchScreen';
import Brightness from '../screens/BrightnessScreen';
import Calendars from '../screens/CalendarsScreen';
import Constants from '../screens/ConstantsScreen';
import ContactDetail from '../screens/Contacts/ContactDetailScreen';
import Contacts from '../screens/Contacts/ContactsScreen';
import Device from '../screens/DeviceScreen';
import DocumentPicker from '../screens/DocumentPickerScreen';
import Events from '../screens/EventsScreen';
import FacebookLogin from '../screens/FacebookLoginScreen';
import FileSystem from '../screens/FileSystemScreen';
import Font from '../screens/FontScreen';
import Google from '../screens/GoogleScreen';
import ImageManipulator from '../screens/ImageManipulatorScreen';
import ImagePicker from '../screens/ImagePickerScreen';
import IntentLauncher from '../screens/IntentLauncherScreen';
import KeepAwake from '../screens/KeepAwakeScreen';
import Linking from '../screens/LinkingScreen';
import LocalAuthentication from '../screens/LocalAuthenticationScreen';
import MailComposer from '../screens/MailComposerScreen';
import NetInfo from '../screens/NetInfoScreen';
import Notification from '../screens/NotificationScreen';
import Pedometer from '../screens/PedometerScreen';
import Permissions from '../screens/PermissionsScreen';
import Print from '../screens/PrintScreen';
import Recording from '../screens/AV/RecordingScreen';
import Reminders from '../screens/RemindersScreen';
import SafeAreaContext from '../screens/SafeAreaContextScreen';
import ScreenOrientation from '../screens/ScreenOrientationScreen';
import Sharing from '../screens/SharingScreen';
import SecureStore from '../screens/SecureStoreScreen';
import SMS from '../screens/SMSScreen';
import StoreReview from '../screens/StoreReview';
import TextToSpeech from '../screens/TextToSpeechScreen';
import ViewShot from '../screens/ViewShotScreen';
import WebBrowser from '../screens/WebBrowserScreen';

function optionalRequire(requirer: () => { default: React.ComponentType }) {
  try {
    return requirer().default;
  } catch (e) {
    return;
  }
}

const AppleAuthentication = optionalRequire(() => require('../screens/AppleAuthenticationScreen'));
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
const Accelerometer = optionalRequire(() => require('../screens/AccelerometerScreen'));
const Appearance = optionalRequire(() => require('../screens/AppearanceScreen'));
const FaceDetector = optionalRequire(() => require('../screens/FaceDetectorScreen'));
const Geocoding = optionalRequire(() => require('../screens/GeocodingScreen'));

const optionalScreens: {
  [key: string]: React.ComponentType | undefined;
} = {
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
  Font,
  Google,
  GoogleSignIn,
  Haptics,
  // @ts-ignore
  Calendars,
  Constants,
  // @ts-ignore
  Contacts,
  // @ts-ignore
  ContactDetail,
  // @ts-ignore
  Events,
  Geocoding,
  ImageManipulator,
  ImagePicker,
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
  // @ts-ignore
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

interface ScreensObjectType {
  [key: string]: React.ComponentType;
}

export const Screens = Object.entries(optionalScreens).reduce<ScreensObjectType>(
  (acc, [key, screen]) => {
    if (screen) {
      acc[key] = screen;
    }
    return acc;
  },
  {}
);
