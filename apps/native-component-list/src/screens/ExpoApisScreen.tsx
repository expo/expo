import React from 'react';
import { Notifications } from 'expo';
import { Alert, Platform } from 'react-native';
import { EventSubscription } from 'fbemitter';
import ComponentListScreen from './ComponentListScreen';
import { Screens } from '../navigation/ExpoApis';

try {
  require('react-native-branch').default.subscribe((bundle: any) => {
    if (bundle && bundle.params && !bundle.error) {
      Alert.alert('Opened Branch link', JSON.stringify(bundle.params, null, 2));
    }
  });
} catch (e) {
  // Branch is not available, do nothing
}

export default class ExpoApisScreen extends React.Component {
  static path = '';

  static navigationOptions = {
    title: 'APIs in Expo SDK',
  };

  _notificationSubscription?: EventSubscription;

  componentDidMount() {
    if (Platform.OS !== 'web') {
      this._notificationSubscription = Notifications.addListener(this._handleNotification);
    }
  }

  componentWillUnmount() {
    this._notificationSubscription && this._notificationSubscription.remove();
  }

  _handleNotification = (notification: {
    data: object | string;
    origin: string;
    remote: boolean;
    actionId: string;
    userText?: string;
  }) => {
    let { data } = notification;
    const { origin, remote, actionId, userText } = notification;
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }

    /**
     * Currently on Android this will only fire when selected for local
     * notifications, and there is no way to distinguish between local
     * and remote notifications
     */

    let message: string;
    if (remote) {
      message = `Push notification ${
        actionId ? `"${actionId}"` : origin
      } with data: ${JSON.stringify(data)}`;
    } else {
      message = `Local notification ${
        actionId ? `"${actionId}"` : origin
      } with data: ${JSON.stringify(data)}`;
    }

    if (userText) {
      message += `\nUser provided text: ${userText}.`;
    } else {
      message += `\nNo text provided.`;
    }

    // Calling alert(message) immediately fails to show the alert on Android
    // if after backgrounding the app and then clicking on a notification
    // to foreground the app
    setTimeout(() => alert(message), 1000);
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
