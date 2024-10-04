import React from 'react';
import { Platform } from 'react-native';

import ComponentListScreen from './ComponentListScreen';
import ExpoAPIIcon from '../components/ExpoAPIIcon';

if (Platform.OS !== 'web') {
  // Optionally require expo-notifications as we cannot assume that the module is linked.
  // It's not available on macOS and tvOS yet and we want to avoid errors caused by the top-level import.
  const Notifications = (() => {
    try {
      return require('expo-notifications');
    } catch {
      return null;
    }
  })();

  Notifications?.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

const screens = [
  'Accelerometer',
  'ActionSheet',
  'Alert',
  'Appearance',
  'AppleAuthentication',
  'Audio',
  'AsyncStorage',
  'AuthSession',
  'BackgroundFetch',
  'BackgroundLocation',
  'Battery',
  'Brightness',
  'Calendars',
  'Cellular',
  'Clipboard',
  'Constants',
  'Contacts',
  'Crypto',
  'Device',
  'DocumentPicker',
  'FaceDetector',
  'FileSystem',
  'Font',
  'Errors',
  'ExpoModules',
  'Geocoding',
  'Haptics',
  'ImageManipulator',
  'ImagePicker',
  'IntentLauncher',
  'KeepAwake',
  'Linking',
  'LocalAuthentication',
  'Localization',
  'Location',
  'MailComposer',
  'MediaLibrary',
  'Network',
  'NetInfo',
  'Notification',
  'Pedometer',
  'Permissions',
  'Print',
  'Random',
  'Recording',
  'SMS',
  'NavigationBar',
  'SafeAreaContext',
  'ScreenOrientation',
  'SecureStore',
  'ScreenCapture',
  'Sensor',
  'Sharing',
  'StatusBar',
  'StoreReview',
  'SystemUI',
  'TaskManager',
  'TextToSpeech',
  'TrackingTransparency',
  'ViewShot',
  'WebBrowser',
];

export const ScreenItems = screens.map((name) => ({
  name,
  route: `/apis/${name.toLowerCase()}`,
  // isAvailable: !!Screens[name],
  isAvailable: true,
}));

export default function ExpoApisScreen() {
  const renderItemRight = React.useCallback(
    ({ name }: { name: string }) => (
      <ExpoAPIIcon name={name} style={{ marginRight: 10, marginLeft: 6 }} />
    ),
    []
  );

  return <ComponentListScreen renderItemRight={renderItemRight} apis={ScreenItems} />;
}
