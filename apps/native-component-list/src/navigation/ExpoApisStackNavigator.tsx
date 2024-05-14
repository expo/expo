import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import * as React from 'react';

import getStackConfig from './StackConfig';
import { optionalRequire } from './routeBuilder';
import TabIcon from '../components/TabIcon';
import ExpoApis from '../screens/ExpoApisScreen';
import { ModulesCoreScreens } from '../screens/ModulesCore/ModulesCoreScreen';
import { ScreenConfig } from '../types/ScreenConfig';

const Stack = createStackNavigator();

export const Screens: ScreenConfig[] = [
  {
    getComponent() {
      return optionalRequire(() => require('../screens/ModulesCore/ModulesCoreScreen'));
    },
    name: 'ModulesCore',
    options: { title: 'Expo Modules Core' },
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/StatusBarScreen'));
    },
    name: 'StatusBar',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/AlertScreen'));
    },
    name: 'Alert',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/Clipboard/ClipboardScreen'));
    },
    name: 'Clipboard',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/CellularScreen'));
    },
    name: 'Cellular',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/AccelerometerScreen'));
    },
    name: 'Accelerometer',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/ActionSheetScreen'));
    },
    name: 'ActionSheet',
    options: { title: 'Action Sheet' },
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/AppearanceScreen'));
    },
    name: 'Appearance',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/AppleAuthenticationScreen'));
    },
    name: 'AppleAuthentication',
    options: { title: 'Apple Authentication' },
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/AsyncStorageScreen'));
    },
    name: 'AsyncStorage',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/AV/AudioScreen'));
    },
    name: 'Audio (expo-av)',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/Audio/AudioScreen'));
    },
    name: 'Audio (expo-audio)',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/AuthSession/AuthSessionScreen'));
    },
    name: 'AuthSession',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/Location/BackgroundLocationMapScreen'));
    },
    name: 'BackgroundLocation',
    options: { title: 'Background location' },
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/BackgroundFetchScreen'));
    },
    name: 'BackgroundFetch',
    options: { title: 'Background Fetch' },
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/BatteryScreen'));
    },
    name: 'Battery',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/BrightnessScreen'));
    },
    name: 'Brightness',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/DeviceScreen'));
    },
    name: 'Device',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/DocumentPickerScreen'));
    },
    name: 'DocumentPicker',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/LocalizationScreen'));
    },
    name: 'Localization',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/FaceDetectorScreen'));
    },
    name: 'FaceDetector',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/FileSystemScreen'));
    },
    name: 'FileSystem',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/FontScreen'));
    },
    name: 'Font',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/HapticsScreen'));
    },
    name: 'Haptics',
    options: { title: 'Haptics Feedback' },
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/CalendarsScreen'));
    },
    name: 'Calendars',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/ConstantsScreen'));
    },
    name: 'Constants',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/Contacts/ContactsScreen'));
    },
    name: 'Contacts',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/Contacts/ContactDetailScreen'));
    },
    name: 'ContactDetail',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/ErrorScreen'));
    },
    name: 'Errors',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/EventsScreen'));
    },
    name: 'Events',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/ImageManipulatorScreen'));
    },
    name: 'ImageManipulator',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/ImagePicker/ImagePickerScreen'));
    },
    name: 'ImagePicker',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/IntentLauncherScreen'));
    },
    name: 'IntentLauncher',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/KeepAwakeScreen'));
    },
    name: 'KeepAwake',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/LinkingScreen'));
    },
    name: 'Linking',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/MailComposerScreen'));
    },
    name: 'MailComposer',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/MediaLibrary/MediaLibraryScreen'));
    },
    name: 'MediaLibrary',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/MediaLibrary/MediaAlbumsScreen'));
    },
    name: 'MediaAlbums',
    options: { title: 'MediaLibrary Albums' },
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/MediaLibrary/MediaDetailsScreen'));
    },
    name: 'MediaDetails',
    options: { title: 'MediaLibrary Asset' },
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/NetInfoScreen'));
    },
    name: 'NetInfo',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/NetworkScreen'));
    },
    name: 'Network',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/CryptoScreen'));
    },
    name: 'Crypto',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/NotificationScreen'));
    },
    name: 'Notification',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/LocalAuthenticationScreen'));
    },
    name: 'LocalAuthentication',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/Location/LocationScreen'));
    },
    name: 'Location',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/Location/GeocodingScreen'));
    },
    name: 'Geocoding',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/Location/GeofencingScreen'));
    },
    name: 'Geofencing',
    options: { title: 'Geofencing Map' },
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/PedometerScreen'));
    },
    name: 'Pedometer',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/PrintScreen'));
    },
    name: 'Print',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/AV/RecordingScreen'));
    },
    name: 'Recording',
    options: { title: 'Audio Recording' },
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/RemindersScreen'));
    },
    name: 'Reminders',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/SafeAreaContextScreen'));
    },
    name: 'SafeAreaContext',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/ScreenOrientationScreen'));
    },
    name: 'ScreenOrientation',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/SecureStoreScreen'));
    },
    name: 'SecureStore',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/ScreenCaptureScreen'));
    },
    name: 'ScreenCapture',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/SensorScreen'));
    },
    name: 'Sensor',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/SharingScreen'));
    },
    name: 'Sharing',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/NavigationBarScreen'));
    },
    name: 'NavigationBar',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/SystemUIScreen'));
    },
    name: 'SystemUI',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/SMSScreen'));
    },
    name: 'SMS',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/StoreReview'));
    },
    name: 'StoreReview',
    options: { title: 'Store Review' },
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/TaskManagerScreen'));
    },
    name: 'TaskManager',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/TextToSpeechScreen'));
    },
    name: 'TextToSpeech',
    options: { title: 'Speech' },
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/TrackingTransparencyScreen'));
    },
    name: 'TrackingTransparency',
    options: { title: 'TrackingTransparency' },
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/WebBrowser/WebBrowserScreen'));
    },
    name: 'WebBrowser',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/ViewShotScreen'));
    },
    name: 'ViewShot',
  },
  ...ModulesCoreScreens,
];

function ExpoApisStackNavigator(props: { navigation: BottomTabNavigationProp<any> }) {
  return (
    <Stack.Navigator {...props} {...getStackConfig(props)}>
      <Stack.Screen name="ExpoApis" options={{ title: 'APIs in Expo SDK' }} component={ExpoApis} />

      {Screens.map(({ name, options, getComponent }) => (
        <Stack.Screen name={name} key={name} getComponent={getComponent} options={options ?? {}} />
      ))}
    </Stack.Navigator>
  );
}
const icon = ({ focused }: { focused: boolean }) => {
  return <TabIcon name="code-tags" focused={focused} />;
};
ExpoApisStackNavigator.navigationOptions = {
  title: 'APIs',
  tabBarLabel: 'APIs',
  tabBarIcon: icon,
  drawerIcon: icon,
};

export default ExpoApisStackNavigator;
