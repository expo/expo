---
title: Sending Notifications with Expo's Push API
sidebar_title: Sending Notifications with Expo's Push API
---

import { InlineCode } from '~/components/base/code';

> If you're just getting started and want to focus on the front-end for now, you can skip this step and just use [Expo's push notification tool](https://expo.io/notifications) to send notifications with the click of a button.

Along with the [`expo-notifications`](../versions/latest/sdk/notifications.md) module, which provides all the client-side functionality for push notifications, Expo can also handle sending these notifications off to APNs and FCM for you! All you need to do is send the request to our servers with the ExpoPushToken you grabbed in the last step.

> If you'd rather build a server that communicates with APNs and FCM directly, check out [this guide](sending-notifications-custom.md) (this is more complicated than using Expo's push notification service).

![Diagram explaining sending a push from your server to device](/static/images/sending-notification.png)

When you're ready to send a push notification, take the Expo push token from your user record and send it to the Expo API using a plain old HTTPS POST request. You'll probably do this from your server (you could write a command line tool to send them if you wanted, or send them straight from your app, it's all the same), and the Expo team and community have taken care of wrapping that for you in a few languages:

- [expo-server-sdk-node](https://github.com/expo/expo-server-sdk-node) for Node.js. Maintained by the Expo team.
- [expo-server-sdk-python](https://github.com/expo/expo-server-sdk-python) for Python. Maintained by community developers.
- [expo-server-sdk-ruby](https://github.com/expo/expo-server-sdk-ruby) for Ruby. Maintained by community developers.
- [expo-server-sdk-rust](https://github.com/expo/expo-server-sdk-rust) for Rust. Maintained by community developers.
- [ExpoNotificationsBundle](https://github.com/solvecrew/ExpoNotificationsBundle) for Symfony. Maintained by SolveCrew.
- [exponent-server-sdk-php](https://github.com/Alymosul/exponent-server-sdk-php) for PHP. Maintained by community developers.
- [exponent-server-sdk-golang](https://github.com/oliveroneill/exponent-server-sdk-golang) for Golang. Maintained by community developers.
- [exponent-server-sdk-elixir](https://github.com/rdrop/exponent-server-sdk-elixir) for Elixir. Maintained by community developers.
- [expo-server-sdk-dotnet](https://github.com/glyphard/expo-server-sdk-dotnet) for dotnet. Maintained by community developers.
- [expo-server-sdk-java](https://github.com/jav/expo-server-sdk-java) for Java. Maintained by community developers.

Check out the source if you would like to implement it in another language.

> **Note:**
>
> If you're **not** testing in the Expo client app, make sure you've [generated the proper push credentials](push-notifications-setup.md#credentials) before proceeding! If you haven't, push notifications will not work.

## HTTP/2 API

Don't want to use one of the above libraries? You may want to send requests directly to our HTTP/2 API (this API currently does not require any authentication).

To do so, send a POST request to `https://exp.host/--/api/v2/push/send` with the following HTTP headers:

```
host: exp.host
accept: application/json
accept-encoding: gzip, deflate
content-type: application/json
```

This is a "hello world" push notification using cURL that you can send using your CLI (replace the placeholder push token with your own):

```sh
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

```sh
curl -H "Content-Type: application/json" -X POST "https://exp.host/--/api/v2/push/getReceipts" -d '{
  "ids": [
    "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
    "YYYYYYYY-YYYY-YYYY-YYYY-YYYYYYYYYYYY",
    "ZZZZZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZZZZZZZZZ",
  ]
}'
```

The [response body](#push-receipt-response-format) for push receipts is very similar to that of push tickets; it is a JSON object with two optional fields, `data` and `errors`. `data` contains a mapping of receipt IDs to receipts. Receipts include a `status` field, and two optional `message` and `details` fields (in the case where `"status": "error"`). If there is no push receipt for a requested receipt ID, the mapping won't contain that ID. This is what a successful response to the above request looks like:

```json
{
  "data": {
    "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX": { "status": "ok" },
    "ZZZZZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZZZZZZZZZ": { "status": "ok" }
    // When there is no receipt with a given ID (YYYYYYYY-YYYY-YYYY-YYYY-YYYYYYYYYYYY in this
    // example), the ID is omitted from the response.
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

### Push ticket errors

- `DeviceNotRegistered`: the device cannot receive push notifications anymore and you should stop sending messages to the corresponding Expo push token.

### Push receipt errors

- `DeviceNotRegistered`: the device cannot receive push notifications anymore and you should stop sending messages to the corresponding Expo push token.

- `MessageTooBig`: the total notification payload was too large. On Android and iOS the total payload must be at most 4096 bytes.

- `MessageRateExceeded`: you are sending messages too frequently to the given device. Implement exponential backoff and slowly retry sending messages.

- `InvalidCredentials`: your push notification credentials for your standalone app are invalid (ex: you may have revoked them). Run `expo build:ios -c` to regenerate new push notification credentials for iOS. If you revoke an APN key, all apps that rely on that key will no longer be able to send or receive push notifications until you upload a new key to replace it. Uploading a new APN key will **not** change your users' Expo Push Tokens.
  - Sometimes, these errors will contain further details claiming an `InvalidProviderToken` error. This is actually tied to both your APN key **and** your provisioning profile. To resolve this error, you should rebuild the app and regenerate a new push key and provisioning profile.

> Note: For a better understanding of iOS credentials, including push notification credentials, read our [App Signing docs](../distribution/app-signing.md#ios)

### Request errors

If there's an error with the entire request for either push tickets or push receipts, the `errors` object may be one of the following values, and you should handle these errors like so:

- `PUSH_TOO_MANY_EXPERIENCE_IDS`: you are trying to send push notifications to different Expo experiences, for example `@username/projectAAA` and `@username/projectBBB`. Check the `details` field for a mapping of experience names to their associated push tokens from the request, and remove any from another experience.

- `PUSH_TOO_MANY_NOTIFICATIONS`: you are trying to send more than 100 push notifications in one request. Make sure you are only sending 100 (or less) notifications in each request.

- `PUSH_TOO_MANY_RECEIPTS`: you are trying to get more than 1000 push receipts in one request. Make sure you are only sending an array of 1000 (or less) ticket ID strings to get your push receipts.

## Formats

### Message request format

Each message must be a JSON object with the given fields (only the `to` field is required):

| Field        | Platform?     | Type                                                     | Description                                                                                                                                                                                                                                                           |
| ------------ | ------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `to`         | iOS & Android | <InlineCode>string \| string[]</InlineCode>              | An Expo push token or an array of Expo push tokens specifying the recipient(s) of this message.                                                                                                                                                                       |
| `data`       | iOS & Android | `Object`                                                 | A JSON object delivered to your app. It may be up to about 4KiB; the total notification payload sent to Apple and Google must be at most 4KiB or else you will get a "Message Too Big" error.                                                                         |
| `title`      | iOS & Android | `string`                                                 | The title to display in the notification. Often displayed above the notification body                                                                                                                                                                                 |
| `body`       | iOS & Android | `string`                                                 | The message to display in the notification.                                                                                                                                                                                                                           |
| `ttl`        | iOS & Android | `number`                                                 | Time to Live: the number of seconds for which the message may be kept around for redelivery if it hasn't been delivered yet. Defaults to `undefined` in order to use the respective defaults of each provider (0 for iOS/APNs and 2419200 (4 weeks) for Android/FCM). |
| `expiration` | iOS & Android | `number`                                                 | Timestamp since the UNIX epoch specifying when the message expires. Same effect as `ttl` (`ttl` takes precedence over `expiration`).                                                                                                                                  |
| `priority`   | iOS & Android | <InlineCode>'default' \| 'normal' \| 'high'</InlineCode> | The delivery priority of the message. Specify "default" or omit this field to use the default priority on each platform ("normal" on Android and "high" on iOS).                                                                                                      |
| `subtitle`   | iOS Only      | `string`                                                 | The subtitle to display in the notification below the title.                                                                                                                                                                                                          |
| `sound`      | iOS Only      | <InlineCode>'default' \| null</InlineCode>               | Play a sound when the recipient receives this notification. Specify `"default"` to play the device's default notification sound, or omit this field to play no sound.                                                                                                 |
| `badge`      | iOS Only      | `number`                                                 | Number to display in the badge on the app icon. Specify zero to clear the badge.                                                                                                                                                                                      |
| `channelId`  | Android Only  | `string`                                                 | ID of the Notification Channel through which to display this notification. If an ID is specified but the corresponding channel does not exist on the device (i.e. has not yet been created by your app), the notification will not be displayed to the user.          |

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

## Delivery Guarantees

Expo makes a best effort to deliver notifications to the push notification services operated by Apple and Google. Expo's infrastructure is designed for at-least-once delivery to the underlying push notification services; it is more likely for a notification to be delivered to Apple or Google more than once rather than not at all, though both are uncommon but possible.

After a notification has been handed off to an underlying push notification service, Expo creates a "push receipt" that records whether the handoff was successful; a push receipt denotes whether the underlying push notification service received the notification.

Finally, the push notification services from Apple, Google, etc... make a best effort to deliver the notification to the device according to their own policies.
