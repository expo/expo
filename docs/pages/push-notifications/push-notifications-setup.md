---
title: Push Notifications Setup
sidebar_title: Setup
---

import { Tab, Tabs } from '~/components/plugins/Tabs';

To get the client-side ready for push notifications, the 2 main things we need are:

- The user's permission to send them push notifications
- The user's ExpoPushToken- if push notifications are mail, then the ExpoPushToken is the user's address.

We can easily grab both of these using the `expo-notifications` library. For permissions, use [`requestPermissionsAsync`](../versions/latest/sdk/notifications.md#requestpermissionsasyncrequest-notificationpermissionsrequest-promisenotificationpermissionsstatus), and for the ExpoPushToken, use [`getExpoPushTokenAsync`](../versions/latest/sdk/notifications.md#getexpopushtokenasyncoptions-expotokenoptions-expopushtoken).

> Note: in the managed workflow, you don't need to pass any additional options to `getExpoPushTokenAsync`. In the bare workflow, you'll need to pass your `experienceId`. Make sure you read the documentation for more information.

The following method takes care of all this for you, so feel free to copy/paste it.

<Tabs>
<Tab label="New notifications">

{/* prettier-ignore */}
```javascript
registerForPushNotificationsAsync = async () => {
  /* @info We should also make sure the app is running on a physical device, since push notifications won't work on a simulator. */
  if (Device.isDevice) {
    /* @end */
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    /* @info Alright, we got our token! */
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    /* @end */
    console.log(token);
    this.setState({ expoPushToken: token });
  } else {
    alert('Must use physical device for Push Notifications');
  }

  /* @info On Android, we need to specify a channel. Find out more specifics in the expo-notifications documentation. */
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  /* @end */
};
```

</Tab>
<Tab label="Legacy notifications">

{/* prettier-ignore */}
```javascript
registerForPushNotificationsAsync = async () => {
  /* @info We should also make sure the app is running on a physical device, since push notifications won't work on a simulator. */
  if (Device.isDevice) {
    /* @end */
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
    /* @info Alright, we got our token! */
    const token = await Notifications.getExpoPushTokenAsync();
    /* @end */
    console.log(token);
    this.setState({ expoPushToken: token });
  } else {
    alert('Must use physical device for Push Notifications');
  }

  /* @info On Android, we need to specify a channel. Find out more specifics in the expo-notifications documentation. */
  if (Platform.OS === 'android') {
    Notifications.createChannelAndroidAsync('default', {
      name: 'default',
      sound: true,
      priority: 'max',
      vibrate: [0, 250, 250, 250],
    });
  }
  /* @end */
};
```

</Tab>
</Tabs>

## Credentials

For Android, both managed and bare workflow users need to follow our [FCM setup guide](using-fcm.md), it should only take about 5 minutes.

For iOS, EAS Build will take care of push notification credentials automatically when you run a build. If are you using bare workflow and not building with EAS Build, you will need to run `eas credentials` manually.

> Note: A paid Apple Developer Account is **required** to generate credentials.

## Next steps

Try out [sending a notification with Expo](./sending-notifications.md)!

## See also

- Having trouble? Visit [Expo's notification FAQ page](./faq.md)
