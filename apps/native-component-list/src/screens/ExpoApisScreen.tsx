import { Platform } from '@unimodules/core';
import * as Notifications from 'expo-notifications';
import React from 'react';
import { Alert } from 'react-native';

import ExpoAPIIcon from '../components/ExpoAPIIcon';
import { Screens } from '../navigation/ExpoApis';
import ComponentListScreen from './ComponentListScreen';

try {
  require('react-native-branch').default.subscribe((bundle: any) => {
    if (bundle && bundle.params && !bundle.error) {
      Alert.alert('Opened Branch link', JSON.stringify(bundle.params, null, 2));
    }
  });
} catch (e) {
  // Branch is not available, do nothing
}

if (Platform.OS !== 'web')
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

const screens = [
  'Accelerometer',
  'ActionSheet',
  'AppAuth',
  'Appearance',
  'AppleAuthentication',
  'Audio',
  'AuthSession',
  'Battery',
  'BackgroundFetch',
  'Branch',
  'Brightness',
  'Calendars',
  'Constants',
  'Contacts',
  'Device',
  'DocumentPicker',
  'FacebookLogin',
  'FaceDetector',
  'FileSystem',
  'FirebaseRecaptcha',
  'Font',
  'Geocoding',
  'Google',
  'GoogleSignIn',
  'Haptics',
  'ImagePicker',
  'ImageManipulator',
  'InAppPurchases',
  'IntentLauncher',
  'KeepAwake',
  'Linking',
  'LocalAuthentication',
  'Localization',
  'Location',
  'MailComposer',
  'MediaLibrary',
  'NetInfo',
  'Notification',
  'Pedometer',
  'Permissions',
  'Print',
  'Recording',
  'SafeAreaContext',
  'ScreenOrientation',
  'Sensor',
  'SecureStore',
  'Sharing',
  'SMS',
  'StoreReview',
  'TaskManager',
  'TextToSpeech',
  'WebBrowser',
  'ViewShot',
];

export default function ExpoApisScreen() {
  const apis = React.useMemo(() => {
    return screens
      .map(name => ({ name, route: `/apis/${name.toLowerCase()}`, isAvailable: !!Screens[name] }))
      .sort((a, b) => {
        if (a.isAvailable !== b.isAvailable) {
          if (a.isAvailable) {
            return -1;
          }
          return 1;
        }
        return 0;
      });
  }, []);

  const renderItemRight = React.useCallback(
    ({ name }) => <ExpoAPIIcon name={name} style={{ marginRight: 10, marginLeft: 6 }} />,
    []
  );

  return <ComponentListScreen renderItemRight={renderItemRight} apis={apis} />;
}
