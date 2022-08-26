---
title: Sending Notifications with APNs & FCM
hideFromSearch: true
---

Communicating directly with APNs and FCM is much more complicated than sending notifications through [Expo's push notification service](sending-notifications.md), so you should only use this feature if you're prepared to undertake that complexity. Here are a few things you'll have to handle yourself if you choose to write your own server for FCM and APNs:

- Differentiating between native iOS & Android device tokens on your backend
- Twice the amount of backend code to write and maintain (code for communicating with FCM, and then code for communicating with APNs)
- Fetching responses from FCM and APNs to check if your notification went through, error handling, credentials management

That being said, sometimes you need finer-grained control over your notifications, so communicating directly with APNs and FCM is necessary. The Expo platform does not lock you into using Expo's application services, and the `expo-notifications` API is push-service agnostic (you can use it with any push notification service).

## How do I write my own APNs & FCM servers?

Before we begin communicating directly with APNs & FCM, there is one client-side change you'll need to make in your app. When using Expo's notification service, you collect the `ExponentPushToken` with [`getExpoPushTokenAsync`](../versions/latest/sdk/notifications.md#getexpopushtokenasyncoptions-expotokenoptions-expopushtoken). Now that you're not using Expo's notification service, you'll need to collect the native device token instead with [`getDevicePushTokenAsync`](../versions/latest/sdk/notifications.md#getdevicepushtokenasync-devicepushtoken).

```diff
import * as Notifications from 'expo-notifications';
...
- const token = (await Notifications.getExpoPushTokenAsync()).data;
+ const token = (await Notifications.getDevicePushTokenAsync()).data;
// send token off to your server
```

Now that you have your native device token, we can start to implement our servers. Below are some very minimal examples of communicating with FCM and APNs:

## FCM Server

> This documentation is based off of [Google's documentation](https://firebase.google.com/docs/cloud-messaging/http-server-ref), and we're just going to cover the basics here to get you started.

Communicating with FCM is as simple as sending a POST request, but before sending or receiving any notifications, you'll need to follow the steps [in this documentation](using-fcm.md) to configure FCM (and get your `FCM-SERVER-KEY`).

> Note: the following example uses FCM's legacy HTTP API, since the credentials setup for that is the same as it is for the Expo notifications service, so there's no additional work needed on your part. If you'd rather use FCM's HTTP v1 API, follow [this migration guide](https://firebase.google.com/docs/cloud-messaging/migrate-v1).

```js
await fetch('https://fcm.googleapis.com/fcm/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `key=<FCM-SERVER-KEY>`,
  },
  body: JSON.stringify({
    to: '<NATIVE-DEVICE-PUSH-TOKEN>',
    priority: 'normal',
    data: {
      experienceId: '@yourExpoUsername/yourProjectSlug',
      scopeKey: '@yourExpoUsername/yourProjectSlug',
      title: "\uD83D\uDCE7 You've got mail",
      message: 'Hello world! \uD83C\uDF10',
    },
  }),
});
```

**The `experienceId` and `scopeKey` fields are required**, otherwise your notifications will not go through to your app. FCM has their full list of supported fields in the notification payload [here](https://firebase.google.com/docs/cloud-messaging/http-server-ref#notification-payload-support), and you can see which ones are supported by `expo-notifications` on Android by looking at [the documentation](../versions/latest/sdk/notifications.md#firebaseremotemessage).

> FCM also provides some server-side libraries in a few languages you can use instead of raw `fetch` requests. [See here for more info](https://firebase.google.com/docs/cloud-messaging/send-message#node.js).

### Where can I find my FCM server key?

Your FCM server key can be found by making sure you've followed [this documentation](using-fcm.md), and under `Uploading Server Credentials`, instead of uploading your FCM key to Expo, you would use that key directly in your server (as the `FCM-SERVER-KEY` in the example above).

## APNs Server

> This documentation is based off of [Apple's documentation](https://developer.apple.com/library/archive/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/APNSOverview.html#//apple_ref/doc/uid/TP40008194-CH8-SW1), and we're just going to cover the basics here to get you started.

Communicating with APNs is a little more complicated than with FCM. There are some libraries that wrap all of this functionality into one or two function calls (like [`node-apn`](https://github.com/node-apn/node-apn)), but in this example we're going to use the minimum required libraries to give you a good understanding of what's happening.

### Authorization

The first thing you need before sending requests to APNs is permission to send notifications to your app, which is going to be granted via a JSON web token. This web token is generated using these iOS developer credentials:

- APN key (`.p8` file) associated with your app
- Key ID of the above `.p8` file
- Your Apple Team ID

```js
const jwt = require("jsonwebtoken");
const authorizationToken = jwt.sign(
  {
    iss: "YOUR-APPLE-TEAM-ID"
    iat: Math.round(new Date().getTime() / 1000),
  },
  fs.readFileSync("./path/to/appName_apns_key.p8", "utf8"),
  {
    header: {
      alg: "ES256",
      kid: "YOUR-P8-KEY-ID",
    },
  }
);
```

### HTTP/2 Connection

Now that we have our `authorizationToken`, we can open up an HTTP/2 connection to Apple's servers. In development, you'll want to send requests to `api.development.push.apple.com`, but in production requests should go to `api.push.apple.com`.

Here's how to construct your request:

```js
const http2 = require('http2');

const client = http2.connect(
  IS_PRODUCTION ? 'https://api.push.apple.com' : 'https://api.sandbox.push.apple.com'
);

const request = client.request({
  ':method': 'POST',
  ':scheme': 'https',
  'apns-topic': 'YOUR-BUNDLE-IDENTIFIER',
  ':path': '/3/device/' + nativeDeviceToken, // This is the native device token you grabbed client-side
  authorization: `bearer ${authorizationToken}`, // This is the JSON web token we generated in the "Authorization" step above
});
request.setEncoding('utf8');

request.write(
  JSON.stringify({
    aps: {
      alert: {
        title: "\uD83D\uDCE7 You've got mail!",
        body: 'Hello world! \uD83C\uDF10',
      },
    },
    experienceId: '@yourExpoUsername/yourProjectSlug', // Required when testing in the Expo Go app
    scopeKey: '@yourExpoUsername/yourProjectSlug', // Required when testing in the Expo Go app
  })
);
request.end();
```

> This example is **very** minimal, and includes no error handling nor connection pooling. For testing purposes, you should refer to [this example code instead](https://github.com/expo/fyi/expo/master/docs/public/static/code/sendNotificationToAPNS.js).

APNs provides their full list of supported fields in the notification payload [here](https://developer.apple.com/library/archive/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/PayloadKeyReference.html#//apple_ref/doc/uid/TP40008194-CH17-SW1).

## Payload Formats

The examples above show bare minimum notification requests, which aren't that exciting. You probably want to send category identifiers, custom sounds, icons, custom key-value pairs, etc. `expo-notifications` documents all the fields it supports, and here are the payloads we send in our notifications service, as an example:

### iOS

```json
{
  "aps": {
    "alert": {
      "title": title of your message,
      "subtitle": subtitle of your message (shown below title, above body),
      "body": body of your message,
      "launch-image": the name of the launch image file to display,
    },
    "category": the category associated with this notification,
    "badge": number to set badge count to upon notification's arrival,
    "sound": the sound to play when the notification is received,
    "thread-id": app-specific identifier for grouping related notifications
  },
  "body": { object of key-value pairs },
  "experienceId": "@yourExpoUsername/yourProjectSlug",
  "scopeKey": "@yourExpoUsername/yourProjectSlug",
}
```

### Android

```json
{
  "token": native device token string,
  "collapse_key": string that identifies notification as collapsable,
  "priority": "normal" || "high",
  "data": {
    "experienceId": "@yourExpoUsername/yourProjectSlug",
    "scopeKey": "@yourExpoUsername/yourProjectSlug",
    "title": title of your message,
    "message": body of your message,
    "channelId": the android channel ID associated with this notification,
    "categoryId": the category associated with this notification,
    "icon": the icon to show with this notification,
    "link": the link this notification should open,
    "sound": boolean or the custom sound file you'd like to play,
    "vibrate": "true" | "false" | number[],
    "priority": AndroidNotificationPriority, // https://docs.expo.dev/versions/latest/sdk/notifications/#androidnotificationpriority
    "badge": the number to set the icon badge to,
    "body": { object of key-value pairs }
  }
}
```

### Firebase notification types

There are two types of Firebase Cloud Messaging messages: notification and data messages (see the [official documentation](https://firebase.google.com/docs/cloud-messaging/concept-options#notifications_and_data_messages) for more information). Although the naming can be confusing, we'll try to clear things up:

1. **Notification** messages are only handled (and displayed) by the Firebase library, meaning they won't necessarily wake the app, and `expo-notifications` will not be made aware that your app has received any notification.

2. **Data** messages, on the other hand, are not handled by the Firebase library at all- they are immediately handed off to your app for processing. That's where `expo-notifications` comes in and interprets the data payload, then takes further action based on that data. **In almost all cases, this is the type of notification you want to send.**

When sending a message directly through Firebase, if you send a message of type "notification" instead of "data", you won't know if a user interacted with the notification (no `onNotificationResponse` event), nor will you be able to parse the notification payload for any data in your notification event-related listeners.

> Note: Using notification-type messages may have its upsides when you need a configuration option that has not been exposed by `expo-notifications` yet, but in general it may lead to less predictable situations than using only data-type messages (plus it's not our field of responsibility, you'd have to go to Google to report issues).

How do you send data-type messages instead of notification-type messages? Since code is worth more than a million words, let's see examples of each type using the Node.js Firebase Admin SDK:

```js
const devicePushToken = /* ... */;
const options = /* ... */;

// ❌ The following payload has a root-level notification object
// and thus it will NOT trigger expo-notifications and may not work
// as expected.
admin.messaging().sendToDevice(
  devicePushToken,
  {
    notification: {
      title: "This is a notification-type message",
      body: "`expo-notifications` will never see this 😢",
    },
    data: {
      photoId: 42,
    },
  },
  options
);

// ✅ There is no "notification" key in the root level of the payload
// so the message is a "data" message, thus triggering expo-notifications.
admin.messaging().sendToDevice(
  devicePushToken,
  {
    data: {
      title: "This is a data-type message",
      message: "`expo-notifications` events will be triggered 🤗",
      // ⚠️ Notice the schema of this payload is different
      // than that of Firebase SDK. What is there called "body"
      // here is a "message". For more info see:
      // https://docs.expo.dev/versions/latest/sdk/notifications/#android-push-notification-payload-specification

      body:                              // ⚠️ As per Android payload format specified above, the
        JSON.stringify({ photoId: 42 }), // additional "data" should be placed under "body" key.
    },
  },
  options
);
```

## Next steps

Now that you can send notifications to your app, set your app up for [receiving notifications and taking action based on those events](./receiving-notifications.md)!
