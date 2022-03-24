import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'expo-modules-core';
import * as Notifications from 'expo-notifications';
import React from 'react';

import ExpoAPIIcon from '../components/ExpoAPIIcon';
import ComponentListScreen from './ComponentListScreen';

try {
  require('react-native-branch').default.subscribe((bundle: any) => {
    if (bundle && bundle.params && !bundle.error) {
      // Alert.alert('Opened Branch link', JSON.stringify(bundle.params, null, 2));
    }
  });
} catch {
  // Branch is not available, do nothing
}

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
  'Amplitude',
  'AppAuth',
  'Appearance',
  'AppleAuthentication',
  'Audio',
  'AsyncStorage',
  'AuthSession',
  'BackgroundFetch',
  'BackgroundLocation',
  'Battery',
  'Branch',
  'Brightness',
  'Calendars',
  'Cellular',
  'Clipboard',
  'Constants',
  'Contacts',
  'Device',
  'DocumentPicker',
  'FaceDetector',
  'FacebookAppEvents',
  'FacebookLogin',
  'FileSystem',
  'FirebaseRecaptcha',
  'Font',
  'Errors',
  'Geocoding',
  'Google',
  'GoogleSignIn',
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
    ({ name }) => <ExpoAPIIcon name={name} style={{ marginRight: 10, marginLeft: 6 }} />,
    []
  );

  return <ComponentListScreen renderItemRight={renderItemRight} apis={ScreenItems} />;
}
