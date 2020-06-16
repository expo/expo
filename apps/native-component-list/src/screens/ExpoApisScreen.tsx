import * as Notifications from 'expo-notifications';
import React from 'react';
import { Alert } from 'react-native';

import { Screens } from '../navigation/ExpoApis';
import ComponentListScreen from './ComponentListScreen';
import { Platform } from '@unimodules/core';

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

export default class ExpoApisScreen extends React.Component {
  static path = '';

  static navigationOptions = {
    title: 'APIs in Expo SDK',
  };

  render() {
    // @ts-ignore
    return <ComponentListScreen apis={this._getApis()} tabName="ExpoApis" />;
  }

  _getApis = () => {
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
      'NetInfo',
      'Notification',
      'Pedometer',
      'Permissions',
      'Print',
      'MediaLibrary',
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
    return screens
      .map(name => ({ name, isAvailable: !!Screens[name] }))
      .sort((a, b) => {
        if (a.isAvailable !== b.isAvailable) {
          if (a.isAvailable) {
            return -1;
          }
          return 1;
        }
        return 0;
      });
  };
}
