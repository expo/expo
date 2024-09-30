import * as Device from 'expo-device';
import { type EventSubscription } from 'expo-modules-core';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import React from 'react';
import { Alert, Text, Platform, ScrollView, View } from 'react-native';

import registerForPushNotificationsAsync from '../api/registerForPushNotificationsAsync';
import HeadingText from '../components/HeadingText';
import ListButton from '../components/ListButton';
import MonoText from '../components/MonoText';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';
const BACKGROUND_TASK_SUCCESSFUL = 'Background task successfully ran!';
const BACKGROUND_TEST_INFO = `To test background notification handling:\n(1) Background the app.\n(2) Send a push notification from your terminal. The push token can be found in your logs, and the command to send a notification can be found at https://docs.expo.dev/push-notifications/sending-notifications/#http2-api. On iOS, you need to include "_contentAvailable": "true" in your payload.\n(3) After receiving the notification, check your terminal for:\n"${BACKGROUND_TASK_SUCCESSFUL}"`;

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, (_data) => {
  console.log(BACKGROUND_TASK_SUCCESSFUL);
});

const remotePushSupported = Device.isDevice;
export default class NotificationScreen extends React.Component<
  object,
  {
    lastNotifications?: Notifications.Notification;
  }
> {
  static navigationOptions = {
    title: 'Notifications',
  };

  private _onReceivedListener: EventSubscription | undefined;
  private _onResponseReceivedListener: EventSubscription | undefined;

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
      Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
      // Using the same category as in `registerForPushNotificationsAsync`
      Notifications.setNotificationCategoryAsync('welcome', [
        {
          buttonTitle: `Don't open app`,
          identifier: 'first-button',
          options: {
            opensAppToForeground: false,
          },
        },
        {
          buttonTitle: 'Respond with text',
          identifier: 'second-button-with-text',
          textInput: {
            submitButtonTitle: 'Submit button',
            placeholder: 'Placeholder text',
          },
        },
        {
          buttonTitle: 'Open app',
          identifier: 'third-button',
          options: {
            opensAppToForeground: true,
          },
        },
      ])
        .then((_category) => {})
        .catch((error) => console.warn('Could not have set notification category', error));
    }
  }

  componentWillUnmount() {
    this._onReceivedListener?.remove();
    this._onResponseReceivedListener?.remove();
  }

  render() {
    return (
      <ScrollView contentContainerStyle={{ padding: 10, paddingBottom: 40 }}>
        <HeadingText>Local Notifications</HeadingText>
        <ListButton
          onPress={this._presentLocalNotificationAsync}
          title="Present a notification immediately"
        />
        <ListButton
          onPress={this._scheduleLocalNotificationAsync}
          title="Schedule notification for 10 seconds from now"
        />
        <ListButton
          onPress={this._scheduleLocalNotificationWithCustomSoundAsync}
          title="Schedule notification with custom sound in 1 second (not supported in Expo Go)"
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
        {!remotePushSupported && (
          <Text>
            ⚠️ Remote push notifications are not supported in the simulator, the following tests
            should warn accordingly.
          </Text>
        )}
        <ListButton onPress={this._sendNotificationAsync} title="Send me a push notification" />
        <ListButton
          onPress={this._unregisterForNotificationsAsync}
          title="Unregister for push notifications"
        />
        <BackgroundNotificationHandlingSection />
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

        <HeadingText>Notification Permissions</HeadingText>
        <ListButton onPress={this.getPermissionsAsync} title="Get permissions" />
        <ListButton onPress={this.requestPermissionsAsync} title="Request permissions" />

        <HeadingText>Notification triggers debugging</HeadingText>
        <ListButton
          onPress={() =>
            Notifications.getNextTriggerDateAsync({
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: 10,
            }).then((timestamp) => alert(new Date(timestamp!)))
          }
          title="Get next date for time interval + 10 seconds"
        />
        <ListButton
          onPress={() =>
            Notifications.getNextTriggerDateAsync({
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: 9,
              minute: 0,
            }).then((timestamp) => alert(new Date(timestamp!)))
          }
          title="Get next date for 9 AM"
        />
        <ListButton
          onPress={() =>
            Notifications.getNextTriggerDateAsync({
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              hour: 9,
              minute: 0,
              weekday: 1,
            }).then((timestamp) => alert(new Date(timestamp!)))
          }
          title="Get next date for Sunday, 9 AM"
        />
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

  private getPermissionsAsync = async () => {
    const permission = await Notifications.getPermissionsAsync();
    console.log('Get permission: ', permission);
    alert(`Status: ${permission.status}`);
  };

  private requestPermissionsAsync = async () => {
    const permission = await Notifications.requestPermissionsAsync();
    alert(`Status: ${permission.status}`);
  };

  _obtainUserFacingNotifPermissionsAsync = async () => {
    let permission = await Notifications.getPermissionsAsync();
    if (permission.status !== 'granted') {
      permission = await Notifications.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(`We don't have permission to present notifications.`);
      }
    }
    return permission;
  };

  _obtainRemoteNotifPermissionsAsync = async () => {
    let permission = await Notifications.getPermissionsAsync();
    if (permission.status !== 'granted') {
      permission = await Notifications.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(`We don't have permission to receive remote notifications.`);
      }
    }
    return permission;
  };

  _presentLocalNotificationAsync = async () => {
    await this._obtainUserFacingNotifPermissionsAsync();
    await Notifications.scheduleNotificationAsync({
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

  _scheduleLocalNotificationAsync = async () => {
    await this._obtainUserFacingNotifPermissionsAsync();
    await Notifications.scheduleNotificationAsync({
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
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 10,
      },
    });
  };

  _scheduleLocalNotificationWithCustomSoundAsync = async () => {
    await this._obtainUserFacingNotifPermissionsAsync();
    // Prepare the notification channel
    await Notifications.setNotificationChannelAsync('custom-sound', {
      name: 'Notification with custom sound',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'cat.wav', // <- for Android 8.0+
    });
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Here is a local notification!',
        body: 'This is the body',
        data: {
          hello: 'there',
          future: 'self',
        },
        sound: 'cat.wav',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        channelId: 'custom-sound',
        seconds: 1,
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
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
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

  _unregisterForNotificationsAsync = async () => {
    try {
      await Notifications.unregisterForNotificationsAsync();
    } catch (e) {
      Alert.alert(`An error occurred un-registering for notifications: ${e}`);
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

/**
 * If this test is failing for you on iOS, make sure you:
 *
 * - Have the `remote-notification` UIBackgroundMode in app.json or info.plist
 * - Included "_contentAvailable": "true" in your notification payload
 * - Have "Background App Refresh" enabled in your Settings
 *
 * If it's still not working, try killing the rest of your active apps, since the OS
 * may still decide not to launch the app for its own reasons.
 */
function BackgroundNotificationHandlingSection() {
  const [showInstructions, setShowInstructions] = React.useState(false);

  return (
    <View>
      {showInstructions ? (
        <View>
          <ListButton
            onPress={() => setShowInstructions(false)}
            title="Hide background notification handling instructions"
          />
          <MonoText>{BACKGROUND_TEST_INFO}</MonoText>
        </View>
      ) : (
        <ListButton
          onPress={() => {
            setShowInstructions(true);
            getPermissionsAndLogToken();
          }}
          title="Show background notification handling instructions"
        />
      )}
    </View>
  );
}

async function getPermissionsAndLogToken() {
  let permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') {
    permission = await Notifications.requestPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert(`We don't have permission to receive remote notifications.`);
    }
  }
  if (permission.status === 'granted') {
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    console.log(`Got this device's push token: ${token}`);
  }
}
