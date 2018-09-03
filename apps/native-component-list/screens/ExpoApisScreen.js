import React from 'react';
import { Alert, Platform } from 'react-native';
import { DangerZone, Notifications } from 'expo';
import ComponentListScreen from './ComponentListScreen';

DangerZone.Branch.subscribe(bundle => {
  if (bundle && bundle.params && !bundle.error) {
    Alert.alert('Opened Branch link', JSON.stringify(bundle.params, null, 2));
  }
});

export default class ExpoApisScreen extends React.Component {
  static navigationOptions = {
    title: 'APIs in Expo SDK',
  };

  componentWillMount() {
    this._notificationSubscription = Notifications.addListener(this._handleNotification);
  }

  componentWillUnmount() {
    this._notificationSubscription && this._notificationSubscription.remove();
  }

  _handleNotification = notification => {
    let { data, origin, remote } = notification;
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }

    /**
     * Currently on Android this will only fire when selected for local
     * notifications, and there is no way to distinguish between local
     * and remote notifications
     */

    let message;
    if (Platform.OS === 'android') {
      message = `Notification ${origin} with data: ${JSON.stringify(data)}`;
    } else {
      if (remote) {
        message = `Push notification ${origin} with data: ${JSON.stringify(data)}`;
      } else {
        message = `Local notification ${origin} with data: ${JSON.stringify(data)}`;
      }
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
    return [
      'AuthSession',
      'Branch',
      'Calendars',
      'Constants',
      'Contacts',
      'DocumentPicker',
      'FacebookLogin',
      'FileSystem',
      'Font',
      'Geocoding',
      'GoogleLogin',
      'Haptic',
      'ImagePicker',
      'ImageManipulator',
      'IntentLauncher',
      'KeepAwake',
      'LocalAuthentication',
      'Localization',
      'Location',
      'MailComposer',
      'MediaLibrary',
      'Notification',
      'Pedometer',
      'Permissions',
      'Print',
      'MediaLibrary',
      'ScreenOrientation',
      'Sensor',
      'SecureStore',
      'SMS',
      'StoreReview',
      'TextToSpeech',
      'Util',
      'WebBrowser',
    ];
  };
}
