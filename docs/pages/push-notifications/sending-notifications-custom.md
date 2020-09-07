---
title: Sending Notifications with APNs & FCM
---

Communicating directly with APNs and FCM is much more complicated than sending notifications through [Expo's push notification service](../sending-notifications/), so you should only use this feature if you're prepared to undertake that complexity. Here are a few things you'll have to handle yourself if you choose to write your own server for FCM and APNs:

- Differentiating between native iOS & Android device tokens on your backend
- Twice the amount of backend code to write and maintain (code for communicating with FCM, and then code for communicating with APNs)
- Fetching responses from FCM and APNs to check if your notification went through, error handling, credentials management

That being said, sometimes you need finer-grained control over your notifications, so communicating directly with APNs and FCM is necessary. The Expo platform does not lock you into using Expo's application services, and the `expo-notifications` API is push-service agnostic (you can use it with any push notification service).

## How do I write my own APNs & FCM servers?

Before we begin communicating directly with APNs & FCM, there is one client-side change you'll need to make in your app. When using Expo's notification service, you collect the `ExponentPushToken` with [`getExpoPushTokenAsync`](../../versions/latest/sdk/notifications/#getexpopushtokenasyncoptions-expotokenoptions-expopushtoken). Now that you're not using Expo's notification service, you'll need to collect the native device token instead with [`getDevicePushTokenAsync`](../../versions/latest/sdk/notifications/#getdevicepushtokenasync-devicepushtoken).

```diff
import * as Notifications from 'expo-notifications';
...
- const token = (await Notifications.getExpoPushTokenAsync()).data;
+ const token = (await Notifications.getDevicePushTokenAsync()).data:
// send token off to your server
```

Now that you have your native device token, we can start to implement our servers. Below are some very minimal examples of communicating with FCM and APNs:

## FCM Server

> This documentation is based off of [Google's documentation](https://firebase.google.com/docs/cloud-messaging/http-server-ref), and we're just going to cover the basics here to get you started.

Communicating with FCM is as simple as sending a POST request, but before sending or receiving any notifications, you'll need to follow the steps [in this documentation](../using-fcm/) to configure FCM (and get your `FCM-SERVER-KEY`).

> Note: the following example uses FCM's legacy HTTP API, since the credentials setup for that is the same as it is for the Expo notications service, so there's no additional work needed on your part. If you'd rather use FCM's HTTP v1 API, follow [this migration guide](https://firebase.google.com/docs/cloud-messaging/migrate-v1).

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
      title: "\uD83D\uDCE7 You've got mail",
      message: 'Hello world! \uD83C\uDF10',
    },
  }),
});
```

**The `experienceId` field is required**, otherwise your notifications will not go through to your app. FCM has their full list of supported fields in the notification payload [here](https://firebase.google.com/docs/cloud-messaging/http-server-ref#notification-payload-support), and you can see which ones are supported by `expo-notifications` on Android by looking at [the documentation](../../versions/latest/sdk/notifications/#firebaseremotemessage).

> FCM also provides some server-side libraries in a few languages you can use instead of raw `fetch` requests. [See here for more info](https://firebase.google.com/docs/cloud-messaging/send-message#node.js).

### Where can I find my FCM server key?

Your FCM server key can be found by making sure you've followed [this documentation](../using-fcm/), and under `Uploading Server Credentials`, instead of uploading your FCM key to Expo, you would use that key directly in your server (as the `FCM-SERVER-KEY` in the example above).

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
    experienceId: '@yourExpoUsername/yourProjectSlug', // Required when testing in the Expo client app
  })
);
request.end();
```

> This example is **very** minimal, and includes no error handling nor connection pooling. For testing purposes, you should refer to [this example code](https://github.com/expo/fyi/blob/master/sendNotificationToAPNS.js), instead.

APNs provides their full list of supported fields in the notification payload [here](https://developer.apple.com/library/archive/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/PayloadKeyReference.html#//apple_ref/doc/uid/TP40008194-CH17-SW1).

## Payload Formats

The examples above show bare minimum notification requests, which aren't that exciting. You probably want to send category identifiers, custom sounds, icons, custom key-value pairs, etc. `expo-notifications` documents all the fields it supports, and here are the payloads we send in our notifications service, as an example:

### Android

```json
{
  "token": native device token string,
  "collapse_key": string that identifies notification as collapsable,
  "priority": "normal" || "high",
  "data": {
    "experienceId": "@yourExpoUsername/yourProjectSlug",
    "title": title of your message,
    "message": body of your message,
    "channelId": the android channel ID associated with this notification,
    "categoryId": the category associated with this notification,
    "icon": the icon to show with this notification,
    "link": the link this notification should open,
    "body": { object of key-value pairs }
  }
}
```

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
}
```
