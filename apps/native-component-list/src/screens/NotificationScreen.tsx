import { Subscription } from '@unimodules/core';
import * as Notifications from 'expo-notifications';
import * as Permissions from 'expo-permissions';
import React from 'react';
import { Alert, Platform, ScrollView } from 'react-native';

import registerForPushNotificationsAsync from '../api/registerForPushNotificationsAsync';
import HeadingText from '../components/HeadingText';
import ListButton from '../components/ListButton';
import MonoText from '../components/MonoText';

export default class NotificationScreen extends React.Component<
  object,
  {
    lastNotifications?: Notifications.Notification;
  }
> {
  static navigationOptions = {
    title: 'Notifications',
  };

  private _onReceivedListener: Subscription | undefined;
  private _onResponseReceivedListener: Subscription | undefined;

  constructor(props: object) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    if (Platform.OS !== 'web') {
      this._onReceivedListener = Notifications.addNotificationReceivedListener(
        this._handelReceivedNotification
      );
      this._onResponseReceivedListener = Notifications.addNotificationResponseReceivedListener(
        this._handelNotificationResponseReceived
      );
    }
  }

  componentWillUnmount() {
    this._onReceivedListener?.remove();
    this._onResponseReceivedListener?.remove();
  }

  render() {
    console.log(this.state);
    return (
      <ScrollView style={{ padding: 10 }}>
        <HeadingText>Local Notifications</HeadingText>
        <ListButton
          onPress={this._LEGACY_presentLocalNotificationAsync}
          title="[Legacy] Present a notification immediately"
        />
        <ListButton
          onPress={this._presentLocalNotificationAsync}
          title="Present a notification immediately"
        />
        <ListButton
          onPress={this._scheduleLocalNotificationAsync}
          title="Schedule notification for 10 seconds from now"
        />
        <ListButton
          onPress={this._scheduleLocalNotificationAndCancelAsync}
          title="Schedule notification for 10 seconds from now and then cancel it immediately"
        />
        <ListButton
          onPress={Notifications.cancelAllScheduledNotificationsAsync}
          title="Cancel all scheduled notifications"
        />

        <HeadingText>Push Notifications</HeadingText>
        <ListButton onPress={this._sendNotificationAsync} title="Send me a push notification" />

        <HeadingText>Badge Number</HeadingText>
        <ListButton
          onPress={this._incrementIconBadgeNumberAsync}
          title="Increment the app icon's badge number"
        />
        <ListButton onPress={this._clearIconBadgeAsync} title="Clear the app icon's badge number" />

        <HeadingText>Dismissing notifications</HeadingText>
        <ListButton
          onPress={this._countPresentedNotifications}
          title="Count presented notifications"
        />
        <ListButton onPress={this._dismissSingle} title="Dismiss a single notification" />

        <ListButton onPress={this._dismissAll} title="Dismiss all notifications" />

        {this.state.lastNotifications && (
          <MonoText containerStyle={{ marginBottom: 20 }}>
            {JSON.stringify(this.state.lastNotifications, null, 2)}
          </MonoText>
        )}
      </ScrollView>
    );
  }

  _handelReceivedNotification = (notification: Notifications.Notification) => {
    this.setState({
      lastNotifications: notification,
    });
  };

  _handelNotificationResponseReceived = (
    notificationResponse: Notifications.NotificationResponse
  ) => {
    console.log({ notificationResponse });

    // Calling alert(message) immediately fails to show the alert on Android
    // if after backgrounding the app and then clicking on a notification
    // to foreground the app
    setTimeout(() => Alert.alert('You clicked on the notification 🥇'), 1000);
  };

  _obtainUserFacingNotifPermissionsAsync = async () => {
    let permission = await Permissions.getAsync(Permissions.USER_FACING_NOTIFICATIONS);
    if (permission.status !== 'granted') {
      permission = await Permissions.askAsync(Permissions.USER_FACING_NOTIFICATIONS);
      if (permission.status !== 'granted') {
        Alert.alert(`We don't have permission to present notifications.`);
      }
    }
    return permission;
  };

  _obtainRemoteNotifPermissionsAsync = async () => {
    let permission = await Permissions.getAsync(Permissions.NOTIFICATIONS);
    if (permission.status !== 'granted') {
      permission = await Permissions.askAsync(Permissions.NOTIFICATIONS);
      if (permission.status !== 'granted') {
        Alert.alert(`We don't have permission to receive remote notifications.`);
      }
    }
    return permission;
  };

  _presentLocalNotificationAsync = async () => {
    await this._obtainUserFacingNotifPermissionsAsync();
    Notifications.scheduleNotificationAsync({
      content: {
        title: 'Here is a scheduled notification!',
        body: 'This is the body',
        data: {
          hello: 'there',
          future: 'self',
        },
        sound: true,
      },
      trigger: null,
    });
  };

  _LEGACY_presentLocalNotificationAsync = async () => {
    await this._obtainUserFacingNotifPermissionsAsync();
    Notifications.presentNotificationAsync({
      title: 'Here is a local notification!',
      body: 'This is the body',
      data: {
        hello: 'there',
      },
      sound: true,
    });
  };

  _scheduleLocalNotificationAsync = async () => {
    await this._obtainUserFacingNotifPermissionsAsync();
    Notifications.scheduleNotificationAsync({
      content: {
        title: 'Here is a local notification!',
        body: 'This is the body',
        data: {
          hello: 'there',
          future: 'self',
        },
        sound: true,
      },
      trigger: {
        seconds: 10,
      },
    });
  };

  _scheduleLocalNotificationAndCancelAsync = async () => {
    await this._obtainUserFacingNotifPermissionsAsync();
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'This notification should not appear',
        body: 'It should have been cancelled. :(',
        sound: true,
      },
      trigger: {
        seconds: 10,
      },
    });
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  };

  _incrementIconBadgeNumberAsync = async () => {
    const currentNumber = await Notifications.getBadgeCountAsync();
    await Notifications.setBadgeCountAsync(currentNumber + 1);
    const actualNumber = await Notifications.getBadgeCountAsync();
    Alert.alert(`Set the badge number to ${actualNumber}`);
  };

  _clearIconBadgeAsync = async () => {
    await Notifications.setBadgeCountAsync(0);
    Alert.alert(`Cleared the badge`);
  };

  _sendNotificationAsync = async () => {
    const permission = await this._obtainRemoteNotifPermissionsAsync();
    if (permission.status === 'granted') {
      registerForPushNotificationsAsync();
    }
  };

  _countPresentedNotifications = async () => {
    const presentedNotifications = await Notifications.getPresentedNotificationsAsync();
    Alert.alert(`You currently have ${presentedNotifications.length} notifications presented`);
  };

  _dismissAll = async () => {
    await Notifications.dismissAllNotificationsAsync();
    Alert.alert(`Notifications dismissed`);
  };

  _dismissSingle = async () => {
    const presentedNotifications = await Notifications.getPresentedNotificationsAsync();
    if (!presentedNotifications.length) {
      Alert.alert(`No notifications to be dismissed`);
      return;
    }

    const identifier = presentedNotifications[0].request.identifier;
    await Notifications.dismissNotificationAsync(identifier);
    Alert.alert(`Notification dismissed`);
  };
}
