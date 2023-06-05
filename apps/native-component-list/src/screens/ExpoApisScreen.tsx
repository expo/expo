import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'expo-modules-core';
import * as Notifications from 'expo-notifications';
import React from 'react';

import ExpoAPIIcon from '../components/ExpoAPIIcon';
import ComponentListScreen from './ComponentListScreen';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
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
  'SystemUITheme',
  'TaskManager',
  'TextToSpeech',
  'TrackingTransparency',
  'ViewShot',
  'WebBrowser',
];

if (Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
  screens.push('InAppPurchases');
}

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
