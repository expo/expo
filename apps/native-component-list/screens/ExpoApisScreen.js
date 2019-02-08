import React from 'react';
import { Alert, Platform } from 'react-native';
import { DangerZone, Notifications } from 'expo';
import ComponentListScreen from './ComponentListScreen';
import { Screens } from '../navigation/ExpoApis';

try {
  DangerZone.Branch.subscribe(bundle => {
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

  componentWillMount() {
    if (Platform.OS !== 'web') {
      this._notificationSubscription = Notifications.addListener(this._handleNotification);
    }
  }

  componentWillUnmount() {
    this._notificationSubscription && this._notificationSubscription.remove();
  }

  _handleNotification = notification => {
    let { data, origin, remote, actionId, userText } = notification;
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }

    /**
     * Currently on Android this will only fire when selected for local
     * notifications, and there is no way to distinguish between local
     * and remote notifications
     */

    let message;
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
    return <ComponentListScreen apis={this._getApis()} tabName="ExpoApis" />;
  }

  _getApis = () => {
    const screens = Platform.select({
      web: [
        'ActionSheet',
        'Audio',
        'AuthSession',
        'Constants',
        'DocumentPicker',
        'FileSystem',
        'Font',
        'Geocoding',
        'Google',
        'GoogleSignIn',
        'ImageManipulator',
        'ImagePicker',
        'Linking',
        'Localization',
        'Location',
        'MailComposer',
        'Notification',
        'Permissions',
        'Print',
        'ScreenOrientation',
        'Sensor',
        'SMS',
        'TextToSpeech',
        'Util',
        'ViewShot',
      ],
      default: [
        'ActionSheet',
        'AppAuth',
        'Audio',
        'AuthSession',
        'BackgroundFetch',
        'Branch',
        'Calendars',
        'Constants',
        'Contacts',
        'DocumentPicker',
        'FacebookLogin',
        'FileSystem',
        'Font',
        'Geocoding',
        'Google',
        'GoogleSignIn',
        'Haptics',
        'ImagePicker',
        'ImageManipulator',
        'IntentLauncher',
        'KeepAwake',
        'Linking',
        'LocalAuthentication',
        'Localization',
        'Location',
        'MailComposer',
        'Notification',
        'Pedometer',
        'Permissions',
        'Print',
        'MediaLibrary',
        'Recording',
        'ScreenOrientation',
        'Sensor',
        'SecureStore',
        'SMS',
        'StoreReview',
        'TaskManager',
        'TextToSpeech',
        'Util',
        'WebBrowser',
        'ViewShot',
      ],
    });
    return screens.map(name => ({ name, isAvailable: !!Screens[name] }));
  };
}
