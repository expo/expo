import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as Permissions from 'expo-permissions';
import React from 'react';
import { Text, View, Button, Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default class AppContainer extends React.Component {
  state = {
    expoPushToken: '',
    notification: { request: { content: { body: '', title: '', data: {} } } },
  };

  registerForPushNotificationsAsync = async () => {
    if (Constants.isDevice) {
      const { status: existingStatus } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }
      const { data: token } = await Notifications.getExpoPushTokenAsync();
      console.log(token);
      this.setState({ expoPushToken: token });
    } else {
      alert('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  };

  componentDidMount() {
    this.registerForPushNotificationsAsync();

    this.onReceivedListener = Notifications.addNotificationReceivedListener(this.onReceived);
    this.onResponseReceivedListener = Notifications.addNotificationResponseReceivedListener(
      this.onResponseReceived
    );
  }

  componentWillUnmount() {
    this.onReceivedListener.remove();
    this.onResponseReceivedListener.remove();
  }

  // Called when a notification comes in while the app is foregrounded
  onReceived = notification => {
    console.log(notification);
    this.setState({ notification });
  };

  // Called when a user taps on or interacts with a notification, whether the app is foregrounded, backgrounded, or closed.
  onResponseReceived = response => {
    console.log(response);
  };

  // Can use this function below, OR use Expo's Push Notification Tool-> https://expo.io/dashboard/notifications
  sendPushNotification = async () => {
    const message = {
      to: this.state.expoPushToken,
      sound: 'default',
      title: 'Original Title',
      body: 'And here is the body!',
      data: { data: 'goes here' },
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  };

  render() {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'space-around',
        }}>
        <Text>Your expo push token: {this.state.expoPushToken}</Text>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Text>Title: {this.state.notification.request.content.title}</Text>
          <Text>Body: {this.state.notification.request.content.body}</Text>
          <Text>Data: {JSON.stringify(this.state.notification.request.content.data)}</Text>
        </View>
        <Button title="Press to Send Notification" onPress={() => this.sendPushNotification()} />
      </View>
    );
  }
}
