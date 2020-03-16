---
title: Push Notifications
---

Push Notifications are an important feature, no matter what kind of app you're building. Not only is it nice to let users know about something that may interest them, be it a new album being released, a sale or other limited-time-only deal, or that one of their friends sent them a message, but push notifications are proven to help boost user interaction and create a better overall user experience.

Whether you just want to be able to let users know when a relevant event happens, or you're trying to optimize customer engagement and retention, Expo makes implementing push notifications almost too easy. All the hassle with native device information and communicating with APNS (Apple Push Notification Service) or FCM (Firebase Cloud Messaging) is taken care of behind the scenes, so that you can treat iOS and Android notifications the same, saving you time on the front-end, and back-end!

There are three main steps to setting up push notifications:

- getting a user's Expo Push Token
- calling Expo's Push API with the token when you want to send a notification
- responding to receiving the notification in your app (maybe upon opening, you want to jump to a particular screen that the notification refers to)

> Reading the full guide is important, but to take a quick look at this in action, check out [this example snack](https://snack.expo.io/@charliecruzan/pushnotifications36?platform=ios)!

## Set Up

### 1. Getting the user's Push Token

In order to send a push notification, Expo needs to know which device to send it to. Expo takes care of identifying your device with Apple and Google through the Expo push token, which is uniquely generated each time an app is installed on a device. Once you have this token, save it in association with that user account on your server. This token is what you'll provide to Expo's push notification service. Halfway done with the setup!

![Diagram explaining saving tokens](/static/images/saving-token.png)

```javascript
import { Notifications } from 'expo';
import * as Permissions from 'expo-permissions';

const PUSH_ENDPOINT = 'https://your-server.com/users/push-token';

export default async function registerForPushNotificationsAsync() {
  const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
  // only asks if permissions have not already been determined, because
  // iOS won't necessarily prompt the user a second time.
  // On Android, permissions are granted on app installation, so
  // `askAsync` will never prompt the user

  // Stop here if the user did not grant permissions
  if (status !== 'granted') {
    alert('No notification permissions!');
    return;
  }

  // Get the token that identifies this device
  let token = await Notifications.getExpoPushTokenAsync();

  // POST the token to your backend server from where you can retrieve it to send push notifications.
  return fetch(PUSH_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token: {
        value: token,
      },
      user: {
        username: 'Brent',
      },
    }),
  });
}
```

### 2. Call Expo's Push API with the user's token to send the Notification

> If you're just getting started and want to focus on the front-end for now, you can skip this step and just use [Expo's push notification tool](https://expo.io/notifications) to send notifications with the click of a button.

Push notifications have to come from somewhere, and that somewhere is probably your server (you could write a command line tool to send them if you wanted, or send them straight from your app, it's all the same). When you're ready to send a push notification, take the Expo push token from your user record and send it to the Expo API using a plain old HTTPS POST request. We've taken care of wrapping that for you in a few languages:

![Diagram explaining sending a push from your server to device](/static/images/sending-notification.png)

- [expo-server-sdk-node](https://github.com/expo/expo-server-sdk-node) for Node.js. Maintained by the Expo team.
- [expo-server-sdk-python](https://github.com/expo/expo-server-sdk-python) for Python. Maintained by community developers.
- [expo-server-sdk-ruby](https://github.com/expo/expo-server-sdk-ruby) for Ruby. Maintained by community developers.
- [expo-server-sdk-rust](https://github.com/expo/expo-server-sdk-rust) for Rust. Maintained by community developers.
- [ExpoNotificationsBundle](https://github.com/solvecrew/ExpoNotificationsBundle) for Symfony. Maintained by SolveCrew.
- [exponent-server-sdk-php](https://github.com/Alymosul/exponent-server-sdk-php) for PHP. Maintained by community developers.
- [exponent-server-sdk-golang](https://github.com/oliveroneill/exponent-server-sdk-golang) for Golang. Maintained by community developers.
- [exponent-server-sdk-elixir](https://github.com/rdrop/exponent-server-sdk-elixir) for Elixir. Maintained by community developers.
- [expo-server-sdk-dotnet](https://github.com/glyphard/expo-server-sdk-dotnet) for dotnet. Maintained by community developers.

Check out the source if you would like to implement it in another language.

> **Note:**
>
> For Android, you'll also need to upload your Firebase Cloud Messaging server key to Expo so that Expo can send notifications to your app. **This step is necessary** unless you are not creating your own APK and using just the Expo client app from Google Play. Follow the guide on [Using FCM for Push Notifications](../../guides/using-fcm) to learn how to create a Firebase project, get your FCM server key, and upload the key to Expo.

### 3. Handle receiving the notification in your app

You can now successfully send a notification to your app! If all you wanted was purely informational notifications, then you can stop here. But Expo provides the capabilities to do much more: maybe you want to update the UI based on the notification, or maybe navigate to a particular screen if a notification was selected.

Like most things with Expo, handling received notifications is simple and straightforward across all platforms. All you need to do is add a listener using the [`Notifications` API](../../sdk/notifications).

```javascript
import React from 'react';
import { Notifications } from 'expo';
import { Text, View } from 'react-native';

// This refers to the function defined earlier in this guide
import registerForPushNotificationsAsync from './registerForPushNotificationsAsync';

export default class AppContainer extends React.Component {
  state = {
    notification: {},
  };

  componentDidMount() {
    registerForPushNotificationsAsync();

    // Handle notifications that are received or selected while the app
    // is open. If the app was closed and then opened by tapping the
    // notification (rather than just tapping the app icon to open it),
    // this function will fire on the next tick after the app starts
    // with the notification data.
    this._notificationSubscription = Notifications.addListener(this._handleNotification);
  }

  _handleNotification = notification => {
    // do whatever you want to do with the notification
    this.setState({ notification: notification });
  };

  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Origin: {this.state.notification.origin}</Text>
        <Text>Data: {JSON.stringify(this.state.notification.data)}</Text>
      </View>
    );
  }
}
```

> **Important Note**: On iOS, if you do not set `notification.iosDisplayInForeground` (in your `app.json`) or `_displayInForeground` (in your push message) to `true`, you would be wise to handle push notifications that are received while the app is foregrounded, otherwise the user will never see them. You can handle this specific case in your listener by checking if the `origin` of the notification is `received`. Notifications that arrive while the app is foregrounded on iOS do not show up in the system notification list.

Event listeners added using `Notifications.addListener` will receive an object when a notification is received ([docs](../../sdk/notifications/#notification)). The `origin` of the object will vary based on the app's state at the time the notification was received and the user's subsequent action. The table below summarizes the different possibilities and what the `origin` will be in each case.

| Push was received when...                                            |          `origin` will be...          |
| -------------------------------------------------------------------- | :-----------------------------------: |
| App is open and foregrounded                                         |             `'received'`              |
| App is open and backgrounded, then notification is not selected      | no notification is passed to listener |
| App is open and backgrounded, then notification is selected          |             `'selected'`              |
| App was not open, and then opened by selecting the push notification |             `'selected'`              |
| App was not open, and then opened by tapping the home screen icon    | no notification is passed to listener |

<!-- Maybe example of custom UI for handling a notification?
Want to see an example of navigating to a screen with a Notification? Check this out! [][][][][][][][][][][][][] -->

## Testing

iOS and Android simulators cannot receive push notifications, so you will need to test using a physical device. Additionally, when calling `Permissions.askAsync` on the simulator, it will resolve immediately with `undetermined` as the status, regardless of whether you choose to allow or not.

The [Expo push notification tool](https://expo.io/notifications) is also useful for testing push notifications during development. It lets you easily send test notifications to your device, without having to use your CLI or write out a test server.

## Sending notifications from your server

Although there are server-side SDKs in several languages to help you send push notifications, you may want to directly send requests to our HTTP/2 API (this API currently does not require any authentication). All you need to do is send a POST request to `https://exp.host/--/api/v2/push/send` with the following HTTP headers:

```
host: exp.host
accept: application/json
accept-encoding: gzip, deflate
content-type: application/json
```

This is a "hello world" push notification using cURL that you can send using your CLI (replace the placeholder push token with your own):

```bash
curl -H "Content-Type: application/json" -X POST "https://exp.host/--/api/v2/push/send" -d '{
  "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "title":"hello",
  "body": "world"
}'
```

The request body must be JSON. It may either be a single [message object](#message-request-format) (example above) or an array of up to 100 message objects, as long as they are all for the same project (show below). **We recommend using an array when you want to send multiple messages to efficiently minimize the number of requests you need to make to Expo servers.** Here's an example request body that sends four messages:

```json
[
  {
    "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "sound": "default",
    "body": "Hello world!"
  },
  {
    "to": "ExponentPushToken[yyyyyyyyyyyyyyyyyyyyyy]",
    "badge": 1,
    "body": "You've got mail"
  },
  {
    "to": [
      "ExponentPushToken[zzzzzzzzzzzzzzzzzzzzzz]",
      "ExponentPushToken[aaaaaaaaaaaaaaaaaaaaaa]"
    ],
    "body": "Breaking news!"
  }
]
```

The Expo server also optionally accepts gzip-compressed request bodies. This can greatly reduce the amount of upload bandwidth needed to send large numbers of notifications. The [Node Expo Server SDK](https://github.com/expo/expo-server-sdk-node) automatically gzips requests for you, and automatically throttles your requests to smooth out the load, so we highly recommend it!

### Push tickets

The requests above will respond with a JSON object with two optional fields, `data` and `errors`. `data` will contain an array of [**push tickets**](#push-ticket-format) in the same order in which the messages were sent (or one push ticket object, if you send a single message to a single recipient). Each ticket includes a `status` field that indicates whether Expo successfully received the notification and, if successful, an `id` field that can be used to later retrieve a push receipt.

> **Note**: a status of `ok` along with a receipt ID means that the message was received by Expo's servers, **not** that it was received by the user (for that you will need to check the [push receipt](#push-receipts)).

Continuing the above example, this is what a successful response body looks like:

```json
{
  "data": [
    { "status": "ok", "id": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" },
    { "status": "ok", "id": "YYYYYYYY-YYYY-YYYY-YYYY-YYYYYYYYYYYY" },
    { "status": "ok", "id": "ZZZZZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZZZZZZZZZ" },
    { "status": "ok", "id": "AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA" }
  ]
}
```

If there were errors with individual messages, but not the entire request, the bad messages' corresponding push tickets will have a status of `error`, and fields that describe the error, like this:

```json
{
  "data": [
    {
      "status": "error",
      "message": "\\\"ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]\\\" is not a registered push notification recipient",
      "details": {
        "error": "DeviceNotRegistered"
      }
    },
    {
      "status": "ok",
      "id": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
    }
  ]
}
```

If the entire request failed, the HTTP status code will be 4xx or 5xx and the `errors` field will be an array of error objects (usually just one). Otherwise, the HTTP status code will be 200 and your messages will be on their way to the iOS and Android push notification services!

### Push receipts

After receiving a batch of notifications, Expo enqueues each notification to be delivered to the iOS and Android push notification services (APNs and FCM, respectively). Most notifications are typically delivered within a few seconds. Sometimes it may take longer to deliver notifications, particularly if the iOS or Android push notification services are taking longer than usual to receive and deliver notifications, or if Expo's cloud infrastructure is under high load.

Once Expo delivers a notification to the iOS or Android push notification service, Expo creates a [**push receipt**](#push-receipt-response-format) that indicates whether the iOS or Android push notification service successfully received the notification. If there was an error delivering the notification, perhaps due to faulty credentials or service downtime, the push receipt will contain more information regarding that error.

To fetch the push receipts, send a POST request to `https://exp.host/--/api/v2/push/getReceipts`. The [request body](#push-receipt-request-format) must be a JSON object with a field name `ids` that is an array of ticket ID strings:

```bash
curl -H "Content-Type: application/json" -X POST "https://exp.host/--/api/v2/push/getReceipts" -d '{
  "ids": ["XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX", "YYYYYYYY-YYYY-YYYY-YYYY-YYYYYYYYYYYY"]
}'
```

The [response body](#push-receipt-response-format) for push receipts is very similar to that of push tickets; it is a JSON object with two optional fields, `data` and `errors`. `data` contains a mapping of receipt IDs to receipts. Receipts include a `status` field, and two optional `message` and `details` fields (in the case where `"status": "error"`). If there is no push receipt for a requested receipt ID, the mapping won't contain that ID. This is what a successful response to the above request looks like:

```json
{
  "data": {
    "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX": { "status": "ok" },
    "YYYYYYYY-YYYY-YYYY-YYYY-YYYYYYYYYYYY": { "status": "ok" }
  }
}
```

**You must check each push receipt, since they may contain information about errors you need to resolve.** For example, if a device is no longer eligible to receive notifications, Apple's documentation asks that you stop sending notifications to that device. The push receipts will contain information about these errors.

> **Note:** Even if a receipt's `status` says `ok`, this doesn't guarantee that the device has received the message; "ok" in a push receipt means that the Android or iOS push notification service successfully received the notification. If the recipient device is turned off, for example, the iOS or Android push notification service will try to deliver the message but the device won't necessarily receive it.

If the entire request failed, the HTTP status code will be 4xx or 5xx and the `errors` field will be an array of error objects (usually just one). Otherwise, the HTTP status code will be 200 and your messages will be on their way to your users' devices!

## Errors

Expo provides details regarding any errors that occur during this entire process. We'll cover some of the most common errors below so that you can implement logic to handle them automatically on your server. If, for whatever reason, Expo couldn't deliver the message to the Android or iOS push notification service, the push receipt's details may also include service-specific information. This is useful mostly for debugging and reporting possible bugs to Expo.

### Individual errors

Inside both push tickets and push receipts, look for a `details` object with an `error` field. If present, it may be one of the following values, and you should handle these errors like so:

- `DeviceNotRegistered`: the device cannot receive push notifications anymore and you should stop sending messages to the corresponding Expo push token.

- `MessageTooBig`: the total notification payload was too large. On Android and iOS the total payload must be at most 4096 bytes.

- `MessageRateExceeded`: you are sending messages too frequently to the given device. Implement exponential backoff and slowly retry sending messages.

- `InvalidCredentials`: your push notification credentials for your standalone app are invalid (ex: you may have revoked them). Run `expo build:ios -c` to regenerate new push notification credentials for iOS.

### Request errors

If there's an error with the entire request for either push tickets or push receipts, the `errors` object may be one of the following values, and you should handle these errors like so:

- `PUSH_TOO_MANY_EXPERIENCE_IDS`: you are trying to send push notifications to different Expo experiences, for example `@username/projectAAA` and `@username/projectBBB`. Check the `details` field for a mapping of experience names to their associated push tokens from the request, and remove any from another experience.

## FAQ

- **Does Expo store the contents of push notifications?** Expo does not store the contents of push notifications any longer than it takes to deliver the notifications to the push notification services operated by Apple, Google, etc... Push notifications are stored only in memory and in message queues and **not** stored in databases.

- **Does Expo read or share the contents of push notifications?** Expo does not read or share the contents of push notifications and our services keep push notifications only as long as needed to deliver them to push notification services run by Apple and Google. If the Expo team is actively debugging the push notifications service, we may see notification contents (ex: at a breakpoint) but Expo cannot see push notification contents otherwise.

- **How does Expo encrypt connections to push notification services, like Apple's and Google's?** Expo's connections to Apple and Google are encrypted and use HTTPS.

- **What browsers does Expo for Web's push notifications support?** It works on all browsers that support Push API such as Chrome and Firefox. Check the full list here: https://caniuse.com/#feat=push-api.

- **How do I handle expired push notification credentials?** When your push notification credentials have expired, run `expo credentials:manager -p ios` which will provide a list of actions to choose from. Select the removal of your expired credentials and then select "Add new Push Notifications Key".

## Formats

### Message request format

Each message must be a JSON object with the given fields (only the `to` field is required):

| Field        | Platform?     | Type                            | Description                                                                                                                                                                                                                                                           |
| ------------ | ------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `to`         | iOS & Android | `string | string[]`             | An Expo push token or an array of Expo push tokens specifying the recipient(s) of this message.                                                                                                                                                                       |
| `data`       | iOS & Android | `Object`                        | A JSON object delivered to your app. It may be up to about 4KiB; the total notification payload sent to Apple and Google must be at most 4KiB or else you will get a "Message Too Big" error.                                                                         |
| `title`      | iOS & Android | `string`                        | The title to display in the notification. Often displayed above the notification body                                                                                                                                                                                 |
| `body`       | iOS & Android | `string`                        | The message to display in the notification.                                                                                                                                                                                                                           |
| `ttl`        | iOS & Android | `number`                        | Time to Live: the number of seconds for which the message may be kept around for redelivery if it hasn't been delivered yet. Defaults to `undefined` in order to use the respective defaults of each provider (0 for iOS/APNs and 2419200 (4 weeks) for Android/FCM). |
| `expiration` | iOS & Android | `number`                        | Timestamp since the UNIX epoch specifying when the message expires. Same effect as `ttl` (`ttl` takes precedence over `expiration`).                                                                                                                                  |
| `priority`   | iOS & Android | `'default' | 'normal' | 'high'` | The delivery priority of the message. Specify "default" or omit this field to use the default priority on each platform ("normal" on Android and "high" on iOS).                                                                                                      |
| `subtitle`   | iOS Only      | `string`                        | The subtitle to display in the notification below the title.                                                                                                                                                                                                          |
| `sound`      | iOS Only      | `'default' | null`              | Play a sound when the recipient receives this notification. Specify `"default"` to play the device's default notification sound, or omit this field to play no sound.                                                                                                 |
| `badge`      | iOS Only      | `number`                        | Number to display in the badge on the app icon. Specify zero to clear the badge.                                                                                                                                                                                      |
| `channelId`  | Android Only  | `string`                        | ID of the Notification Channel through which to display this notification. If an ID is specified but the corresponding channel does not exist on the device (i.e. has not yet been created by your app), the notification will not be displayed to the user.          |

**Note on `ttl`**: On Android, we make a best effort to deliver messages with zero TTL immediately and do not throttle them. However, setting TTL to a low value (e.g. zero) can prevent normal-priority notifications from ever reaching Android devices that are in doze mode. In order to guarantee that a notification will be delivered, TTL must be long enough for the device to wake from doze mode. This field takes precedence over `expiration` when both are specified.

**Note on `priority`**: On Android, normal-priority messages won't open network connections on sleeping devices and their delivery may be delayed to conserve the battery. High-priority messages are delivered immediately if possible and may wake sleeping devices to open network connections, consuming energy. On iOS, normal-priority messages are sent at a time that takes into account power considerations for the device, and may be grouped and delivered in bursts. They are throttled and may not be delivered by Apple. High-priority messages are sent immediately. Normal priority corresponds to APNs priority level 5 and high priority to 10.

**Note on `channelId`**: If left null, a "Default" channel will be used, and Expo will create the channel on the device if it does not yet exist. However, use caution, as the "Default" channel is user-facing and you may not be able to fully delete it.

### Push ticket format

```javascript
{
  "data": [
    {
      "status": "error" | "ok",
      "id": string, // this is the Receipt ID
      // if status === "error"
      "message": string,
      "details": JSON
    },
    ...
  ],
  // only populated if there was an error with the entire request
  "errors": [{
    "code": number,
    "message": string
  }]
}
```

### Push receipt request format

```javascript
{
  "ids": string[]
}
```

### Push receipt response format

```javascript
{
  "data": {
    Receipt ID: {
      "status": "error" | "ok",
      // if status === "error"
      "message": string,
      "details": JSON
    },
    ...
  },
  // only populated if there was an error with the entire request
  "errors": [{
    "code": string,
    "message": string
  }]
}
```
