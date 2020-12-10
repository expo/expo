---
title: Push Notifications Setup
sidebar_title: Setup
---

import { Tab, Tabs } from '~/components/plugins/Tabs';

To get the client-side ready for push notifications, the 2 main things we need are:

- The user's permission to send them push notifications
- The user's ExpoPushToken- if push notifications are mail, then the ExpoPushToken is the user's address.

Getting the permissions is easy- just use the [`expo-permissions` module](../versions/latest/sdk/permissions.md)! As for the push token, the `expo-notifications` module provides a method exactly for that: [`getExpoPushTokenAsync`](../versions/latest/sdk/notifications.md#getexpopushtokenasyncoptions-expotokenoptions-expopushtoken).

> Note: in the managed workflow, you don't need to pass any additional options to `getExpoPushTokenAsync`. In the bare workflow, you'll need to pass your `experienceId`. Make sure you read the documentation for more information.

The following method takes care of all this for you, so feel free to copy/paste it.

<Tabs>
<Tab label="New notifications">

<!-- prettier-ignore -->
```javascript
registerForPushNotificationsAsync = async () => {
  /* @info We should also make sure the app is running on a physical device, since push notifications won't work on a simulator. */
  if (Constants.isDevice) {
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

<!-- prettier-ignore -->
```javascript
registerForPushNotificationsAsync = async () => {
  /* @info We should also make sure the app is running on a physical device, since push notifications won't work on a simulator. */
  if (Constants.isDevice) {
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

If you're using the bare workflow, or building a standalone app with `expo build:ios` or `expo build:android`, you'll also need to configure the necessary push credentials.

For Android, both managed and bare workflow users need to follow our [FCM setup guide](using-fcm.md), it should only take about 5 minutes.

For iOS, the managed workflow takes care of push notification credentials automatically when you run `expo build:ios`. In the bare workflow, you'll need to use the `expo credentials:manager` command to upload your push notification credentials to Expo's servers. Follow these steps:

1. Make sure your `ios.bundleIdentifier` key in `app.json` is set.
2. Make sure you've created the relevant provisioning profile for your app in the [Apple Developer Console](https://developer.apple.com/account/resources/profiles/list)
3. Run `expo credentials:manager -p ios` in your project directory.
4. Select `Add new Push Notifications Key` (or `Use existing Push Notifications Key in current project` if you already have one)

> Note: A paid Apple Developer Account is **required** to generate credentials.
