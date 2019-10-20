---
title: Push Notifications
---

Push Notifications are an important feature to, as _"growth hackers"_ would say, retain and re-engage users and monetize on their attention, or something. From my point of view it's just super handy to know when a relevant event happens in an app so I can jump back into it and read more. Let's look at how to do this with Expo. Spoiler alert: it's almost too easy.

> **Note:**
>
> iOS and Android simulators cannot receive push notifications. To test them out you will need to use a real-life device. Additionally, when calling Permissions.askAsync on the simulator, it will resolve immediately with "undetermined" as the status, regardless of whether you choose to allow or not.
>
> For Expo for Web, unless you're using localhost, your web page has to support HTTPS in order for push notifications to work.

There are three main steps to wiring up push notifications: sending a user's Expo Push Token to your server, calling Expo's Push API with the token when you want to send a notification, and responding to receiving and/or selecting the notification in your app (for example to jump to a particular screen that the notification refers to). This has all been put together for you to try out in [this example snack](https://snack.expo.io/@charliecruzan/pushnotifications34?platform=ios)!

## 1. Save the user's Expo Push Token on your server

In order to send a push notification to somebody, we need to know about their device. Sure, we know our user's account information, but Apple, Google, and Expo do not understand what devices correspond to "Brent" in your proprietary user account system. Expo takes care of identifying your device with Apple and Google through the Expo push token, which is unique each time an app is installed on a device. All we need to do is send this token to your server so you can associate it with the user account and use it in the future for sending push notifications.

![Diagram explaining saving tokens](/static/images/saving-token.png)

```javascript
import { Notifications } from 'expo';
import * as Permissions from 'expo-permissions';

const PUSH_ENDPOINT = 'https://your-server.com/users/push-token';

export default async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Permissions.getAsync(
    Permissions.NOTIFICATIONS
  );
  let finalStatus = existingStatus;

  // only ask if permissions have not already been determined, because
  // iOS won't necessarily prompt the user a second time.
  if (existingStatus !== 'granted') {
    // Android remote notification permissions are granted during the app
    // install, so this will only ask on iOS
    const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
    finalStatus = status;
  }

  // Stop here if the user did not grant permissions
  if (finalStatus !== 'granted') {
    return;
  }

  // Get the token that uniquely identifies this device
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

## 2. Call Expo's Push API with the user's token

Push notifications have to come from somewhere, and that somewhere is your server, probably (you could write a command line tool to send them if you wanted, it's all the same). When you're ready to send a push notification, grab the Expo push token off of the user record and send it over to the Expo API using a plain old HTTPS POST request. We've taken care of wrapping that for you in a few languages:

![Diagram explaining sending a push from your server to device](/static/images/sending-notification.png)

-   [expo-server-sdk-node](https://github.com/expo/expo-server-sdk-node) for Node.js. Maintained by the Expo team.
-   [expo-server-sdk-python](https://github.com/expo/expo-server-sdk-python) for Python. Maintained by community developers.
-   [expo-server-sdk-ruby](https://github.com/expo/expo-server-sdk-ruby) for Ruby. Maintained by community developers.
-   [expo-server-sdk-rust](https://github.com/expo/expo-server-sdk-rust) for Rust. Maintained by community developers.
-   [ExpoNotificationsBundle](https://github.com/solvecrew/ExpoNotificationsBundle) for Symfony. Maintained by SolveCrew.
-   [exponent-server-sdk-php](https://github.com/Alymosul/exponent-server-sdk-php) for PHP. Maintained by community developers.
-   [exponent-server-sdk-golang](https://github.com/oliveroneill/exponent-server-sdk-golang) for Golang. Maintained by community developers.
-   [exponent-server-sdk-elixir](https://github.com/rdrop/exponent-server-sdk-elixir) for Elixir. Maintained by community developers.

Check out the source if you would like to implement it in another language.

> **Note:**
>
> For Android, you'll also need to upload your Firebase Cloud Messaging server key to Expo so that Expo can send notifications to your app. **This step is necessary** unless you are not creating your own APK and using just the Expo client app from Google Play. Follow the guide on [Using FCM for Push Notifications](../../guides/using-fcm) to learn how to create a Firebase project, get your FCM server key, and upload the key to Expo.
>
> For Expo for Web, you'll also need to upload VAPID keys to Expo so that Expo can send notifications to your app. **This step is necessary** for push notifications on web to work. Follow the guide on [Using VAPID for Web Push Notifications](../../guides/using-vapid) to learn how to generate or upload your VAPID keys and store them on Expo's server.
>
> For [Next.js with Expo for Web](../../guides/using-nextjs), you might need [additional configuration](../../guides/using-nextjs#web-push-notifications-support) in order for push notifications to work.

The [Expo push notification tool](https://expo.io/dashboard/notifications) is also useful for testing push notifications during development. It lets you easily send test notifications to your device.

## 3. Handle receiving and/or selecting the notification

For Android, this step is entirely optional -- if your notifications are purely informational and you have no desire to handle them when they are received or selected, you're already done. Notifications will appear in the system notification tray as you've come to expect, and tapping them will open/foreground the app.

For iOS, if you do not set `notification.iosDisplayInForeground` (in your `app.json`) or `_displayInForeground` (in your push message) to `true`, you would be wise to handle push notifications that are received while the app is foregrounded, because otherwise the user will never see them. Notifications that arrive while the app are foregrounded on iOS do not show up in the system notification list. A common solution is to just show the notification manually. For example, if you get a message on Messenger for iOS, have the app foregrounded, but do not have that conversation open, you will see the notification slide down from the top of the screen with a custom notification UI.

Thankfully, handling push notifications is straightforward with Expo, all you need to do is add a listener using the `Notifications` API.

```javascript
import React from 'react';
import {
  Notifications,
} from 'expo';
import {
  Text,
  View,
} from 'react-native';

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

  _handleNotification = (notification) => {
    this.setState({notification: notification});
  };

  render() {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text>Origin: {this.state.notification.origin}</Text>
        <Text>Data: {JSON.stringify(this.state.notification.data)}</Text>
      </View>
    );
  }
}
```

### Determining `origin` of the notification

Event listeners added using `Notifications.addListener` will receive an object when a notification is received ([docs](../../sdk/notifications/#eventsubscription)). The `origin` of the object will vary based on the app's state at the time the notification was received and the user's subsequent action. The table below summarizes the different possibilities and what the `origin` will be in each case.

| Push was received when...                       | `origin` will be...               |
| ------------------------------------------------|:-----------------:|
| App is open and foregrounded                    | `'received'` |
| App is open and backgrounded, then notification not selected | n/a, no notification is passed to listener |
| App is open and backgrounded, then notification is selected | `'selected'` |
| App was not open, and then opened by selecting the push notification | `'selected'` |
| App was not open, and then opened by tapping the home screen icon | n/a, no notification is passed to listener |

## HTTP/2 API

Although there are server-side SDKs in several languages to help you send push notifications, you may want to directly send requests to our HTTP/2 API.

### Sending notifications

Send a POST request to `https://exp.host/--/api/v2/push/send` with the following HTTP headers:

```
host: exp.host
accept: application/json
accept-encoding: gzip, deflate
content-type: application/json
```

The Expo server also optionally accepts gzip-compressed request bodies. This can greatly reduce the amount of upload bandwidth needed to send large numbers of notifications. The [Node SDK](https://github.com/expo/expo-server-sdk-node) automatically gzips requests for you.

This API currently does not require any authentication.

This is a "hello world" request using cURL (replace the placeholder push token with your own):

```bash
curl -H "Content-Type: application/json" -X POST "https://exp.host/--/api/v2/push/send" -d '{
  "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "title":"hello",
  "body": "world"
}'
```

The HTTP request body must be JSON. It may either be a single message object or an array of up to 100 messages. **We recommend using an array when you want to send multiple messages to efficiently minimize the number of requests you need to make to Expo servers.** This is an example request body that sends four messages:

```json
[{
  "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "sound": "default",
  "body": "Hello world!"
}, {
  "to": "ExponentPushToken[yyyyyyyyyyyyyyyyyyyyyy]",
  "badge": 1,
  "body": "You've got mail"
}, {
  "to": [
    "ExponentPushToken[zzzzzzzzzzzzzzzzzzzzzz]",
    "ExponentPushToken[aaaaaaaaaaaaaaaaaaaaaa]"
  ],
  "body": "Breaking news!"
}]
```

Upon success, the HTTP response will be a JSON object whose `data` field is an array of **push tickets**, each of which corresponds to the message at its respective index in the request. Continuing the above example, this is what a successful response body looks like:

```json
{
  "data": [
    {"status": "ok", "id": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"},
    {"status": "ok", "id": "YYYYYYYY-YYYY-YYYY-YYYY-YYYYYYYYYYYY"},
    {"status": "ok", "id": "ZZZZZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZZZZZZZZZ"},
    {"status": "ok", "id": "AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA"}
  ]
}
```

If you send a single message that isn't wrapped in an array to a single recipient, the `data` field will be the push ticket also not wrapped in an array.

#### Push tickets

Each push ticket indicates whether Expo successfully received the notification and, when successful, a receipt ID to later retrieve a push receipt. When there is an error receiving a message, the ticket's status will be "error" and the ticket will contain information about the error and might not contain a receipt ID. More information about the response format is documented below.

> **Note:** Even if a ticket says "ok", it doesn't guarantee that the notification will be delivered nor that the device has received the message; "ok" in a push ticket means that Expo successfully received the message and enqueued it to be delivered to the Android or iOS push notification service.

#### Push receipts

After receiving a batch of notifications, Expo enqueues each notification to be delivered to the iOS and Android push notification services (APNs and FCM, respectively). Most notifications are typically delivered within a few seconds. Sometimes it may take longer to deliver notifications, particularly if the iOS or Android push notification services are taking longer than usual to receive and deliver notifications, or if Expo's cloud infrastructure is under high load. Once Expo delivers a notification to the iOS or Android push notification service, Expo creates a **push receipt** that indicates whether the iOS or Android push notification service successfully received the notification. If there was an error delivering the notification, perhaps due to faulty credentials or service downtime, the push receipt will contain information about the error.

To fetch the push receipts, send a POST request to `https://exp.host/--/api/v2/push/getReceipts`. The request body must be a JSON object with a field name "ids" that is an array of receipt ID strings:

```bash
curl -H "Content-Type: application/json" -X POST "https://exp.host/--/api/v2/push/getReceipts" -d '{
  "ids": ["XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX", "YYYYYYYY-YYYY-YYYY-YYYY-YYYYYYYYYYYY"]
}'
```

The response body contains a mapping from receipt IDs to receipts:

```json
{
  "data": {
    "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX": { "status": "ok" },
    "YYYYYYYY-YYYY-YYYY-YYYY-YYYYYYYYYYYY": { "status": "ok" }
  }
}
```

**You must check each push receipt, which may contain information about errors you need to resolve.** For example, if a device is no longer eligible to receive notifications, Apple's documentation asks that you stop sending notifications to that device. The push receipts will contain information about these errors.

> **Note:** Even if a receipt says "ok", it doesn't guarantee that the device has received the message; "ok" in a push receipt means that the Android or iOS push notification service successfully received the notification. If the recipient device is turned off, for example, the iOS or Android push notification service will try to deliver the message but the device won't necessarily receive it.

### Message format

Each message must be a JSON object with the given fields:

```javascript
type PushMessage = {
  /**
   * An Expo push token or an array of Expo push tokens specifying the recipient(s)
   * of this message.
   */
  to: string | string[],

  /**
   * A JSON object delivered to your app. It may be up to about 4KiB; the total
   * notification payload sent to Apple and Google must be at most 4KiB or else
   * you will get a "Message Too Big" error.
   */
  data?: Object,

  /**
   * The title to display in the notification. Devices often display this in
   * bold above the notification body. Only the title might be displayed on
   * devices with smaller screens like Apple Watch.
   */
  title?: string,

  /**
   * The message to display in the notification
   */
  body?: string,

  /**
   * Time to Live: the number of seconds for which the message may be kept
   * around for redelivery if it hasn't been delivered yet. Defaults to
   * `undefined` in order to use the respective defaults of each provider.
   * These are 0 for iOS/APNs and 2419200 (4 weeks) for Android/FCM and web
   * push notifications.
   *
   * On Android, we make a best effort to deliver messages with zero TTL
   * immediately and do not throttle them.
   *
   * However, note that setting TTL to a low value (e.g. zero) can prevent
   * normal-priority notifications from ever reaching Android devices that are
   * in doze mode. In order to guarantee that a notification will be delivered,
   * TTL must be long enough for the device to wake from doze mode.
   *
   * This field takes precedence over `expiration` when both are specified.
   */
  ttl?: number,

  /**
   * Rich content that accomplishes the push notification.
   * Note that for iOS, the displaying priority is video > audio > image.
   * In other words, if the message specifies both `video` and `image`,
   * the video will be displayed on iOS devices (and the image will be
   * displayed on Android devices).
   */
  richContent?: {
    /**
     * Remote https url of an image that will be displayed with the notification.
     * The image should not have an alpha channel.
     * Image restrictions on iOS: https://developer.apple.com/documentation/usernotifications/unnotificationattachment.
     * Image formats supported on Android: JPEG, PNG, and GIF (will not be animated).
     *
     * (Note that an animated GIF will not be animated on Android devices. If you
     * wish to use an animated GIF for iOS and a static image for Android, put the
     * GIF as a `video` (see below) and the static image as an `image`.)
     */
    image?: string | {
      url: string,
      options?: {
        /**
         * Whether the image's thumbnail will be displayed.
         * Defaults to `false`.
         */
        thumbnailHidden?: boolean,

        /**
         * (iOS-specific field)
         * The clipping rectangle for a thumbnail image. Each value in this key
         * is a dictionary containing a unit rectangle whose values are in the
         * range 0.0 to 1.0 and represent the portion of the original image that
         * you want to display.
         * For example, specifying `x: 0.25, y: 0.25, width: 0.5, height: 0.5`
         * defines a clipping rectangle that shows only the center portion of
         * the image.
         * Learn more: https://developer.apple.com/documentation/usernotifications/unnotificationattachmentoptionsthumbnailclippingrectkey
         */
        thumbnailClippingRect?: {
          x: number,
          y: number,
          width: number,
          height: number
        }
      }
    },

    /**
     * (iOS-specific field)
     * Remote https url of an audio file that will be played with the notification.
     * Audio restrictions: https://developer.apple.com/documentation/usernotifications/unnotificationattachment
     */
    audio?: string,

    /**
     * (iOS-specific field)
     * Remote https url of a video that will be displayed with the notification.
     * Video restrictions: https://developer.apple.com/documentation/usernotifications/unnotificationattachment
     */
    video?: string | {
      url: string,
      options?: {
        /**
         * Whether the image's thumbnail will be displayed.
         * Defaults to `false`.
         */
        thumbnailHidden?: boolean,

        /**
         * The clipping rectangle for a thumbnail image. Refer to the option
         * `image.options.thumbnailClippingRect` above.
         */
        thumbnailClippingRect?: {
          x: number,
          y: number,
          width: number,
          height: number
        },

        /**
         * For a video, it is the time (in seconds) into the video from which to
         * grab the thumbnail image. For an animated image (i.e. a GIF file),
         * it is the frame number of the animation to use as a thumbnail image.
         * Learn more: https://developer.apple.com/documentation/usernotifications/unnotificationattachmentoptionsthumbnailtimekey
         */
        thumbnailTime?: number
      }
    }
  },

  /**
   * (Android and web only)
   * Remote url of a custom icon that replaces the default notification icon.
   * This value overrides `notification.icon` in `app.json`.
   */
  icon?: string,

  /**
   * A timestamp since the UNIX epoch specifying when the message expires. This
   * has the same effect as the `ttl` field and is just an absolute timestamp
   * instead of a relative time.
   */
  expiration?: number,

  /**
   * The delivery priority of the message. Specify "default" or omit this field
   * to use the default priority on each platform, which is "normal" on Android
   * and "high" on iOS.
   *
   * On Android, normal-priority messages won't open network connections on
   * sleeping devices and their delivery may be delayed to conserve the battery.
   * High-priority messages are delivered immediately if possible and may wake
   * sleeping devices to open network connections, consuming energy.
   *
   * On iOS, normal-priority messages are sent at a time that takes into account
   * power considerations for the device, and may be grouped and delivered in
   * bursts. They are throttled and may not be delivered by Apple. High-priority
   * messages are sent immediately. Normal priority corresponds to APNs priority
   * level 5 and high priority to 10.
   */
  priority?: 'default' | 'normal' | 'high',

  // iOS-specific fields

  /**
   * The subtitle to display in the notification below the title
   */
  subtitle?: string,

  /**
   * A sound to play when the recipient receives this notification. Specify
   * "default" to play the device's default notification sound, or omit this
   * field to play no sound.
   *
   * Note that on apps that target Android 8.0+ (if using `expo build`, built
   * in June 2018 or later), this setting will have no effect on Android.
   * Instead, use `channelId` and a channel with the desired setting.
   */
  sound?: 'default' | null,

  /**
   * Number to display in the badge on the app icon. Specify zero to clear the
   * badge.
   */
  badge?: number,

  /**
   * ID of the Notification Category through which to display this notification.
   *
   * To send a notification with category to the Expo client, prefix the string
   * with the experience ID (`@user/experienceId:yourCategoryId`). For standalone/ejected
   * applications, use plain `yourCategoryId`.
   */
  _category?: string,

  /**
   * Displays the notification when the app is foreground.
   * Defaults to `false`.
   */
  _displayInForeground?: boolean

  // Android-specific fields

  /**
   * ID of the Notification Channel through which to display this notification
   * on Android devices. If an ID is specified but the corresponding channel
   * does not exist on the device (i.e. has not yet been created by your app),
   * the notification will not be displayed to the user.
   *
   * If left null, a "Default" channel will be used, and Expo will create the
   * channel on the device if it does not yet exist. However, use caution, as
   * the "Default" channel is user-facing and you may not be able to fully
   * delete it.
   */
  channelId?: string,

  // Web-specific fields

  /**
   * The web path that will be opened/focused after the user clicks the
   * notification.
   * Defaults to "/" (root)
   */
  webPath?: string,

  /**
   * URL or `mailto:` URL which provides a point of contact in case the
   * push service needs to contact the message sender.
   * Defaults to the value stored on Expo's server.
   * Learn more here: https://docs.expo.io/versions/latest/guides/using-vapid/
   */
  vapidSubject?: string,

  /**
   * When a new notification is shown with the same tag, any old notifications
   * with that tag are removed before the new notification is shown.
   * Defaults to none, which means the new notification will not replace any
   * old notifications.
   */
  _tag?: string,

  /**
   * Only applicable when `_tag` is set.
   * Whether a new notification of the same tag will play a sound, vibrate and
   * wake up the users device.
   * Defaults to `false`, which means that the new notification replacing an
   * existing one (i.e., with the same `_tag`) will have no sound, vibration
   * and the screen is kept asleep.
   */
  _renotify?: boolean
}
```

### Response format

The response is a JSON object with two optional fields, `data` and `errors`. If there is an error with the entire request, the HTTP status code will be 4xx or 5xx and `errors` will be an array of error objects (usually just one):

```json
{
  "errors": [{
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unknown error occurred."
  }]
}
```

If there are errors that affect individual messages but not the entire request, the HTTP status code will be 200, the `errors` field will be empty, and the `data` field will contain push tickets that describe the errors:

```json
{
  "data": [{
    "status": "error",
    "message": "\\\"ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]\\\" is not a registered push notification recipient",
    "details": {
      "error": "DeviceNotRegistered"
    }
  }, {
    "status": "ok",
    "id": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
  }]
}
```

> **Note:** You should check the ticket for each notification to determine if there was a problem delivering it to Expo. In particular, **do not assume a 200 HTTP status code means your notifications were sent successfully**; the granularity of push notification errors is finer than that of HTTP statuses.

The HTTP status code will be 200 also if all of the messages were successfully delivered to Expo and enqueued to be delivered to the iOS and Android push notification services.

Successful push receipts, and some types of failed ones, will contain an "id" field with the ID of a receipt to fetch later.

### Receipt request format

Each receipt request must contain a field named "ids" that is an array of receipt IDs:

```javascript
{
  "ids": string[]
}
```

### Receipt response format

The response format for push receipts is similar to that of push tickets; it is a JSON object with two optional fields, `data` and `errors`. If there is an error with the entire request, the HTTP status code will be 4xx or 5xx and `errors` will be an array of error objects.

If there are errors that affected individual notifications but not the entire request, the HTTP status code will be 200, the `errors` field will be empty, and the `data` field will be a JSON object whose keys are receipt IDs and values are corresponding push receipts. If there is no push receipt for a requested receipt ID, the mapping won't contain that ID. This is an example response:

```json
{
  "data": {
    "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX": {
      "status": "error",
      "message": "The Apple Push Notification service failed to send the notification",
      "details": {
        "error": "DeviceNotRegistered"
      }
    },
    "YYYYYYYY-YYYY-YYYY-YYYY-YYYYYYYYYYYY": {
      "status": "ok"
    }
  }
}
```

> **Note:** You should check each receipt to determine if there was an issue delivering the notification to the Android or iOS push notification service. In particular, **do not assume a 200 HTTP status code means your notifications were sent successfully**; the granularity of push notification errors is finer than that of HTTP statuses.

The HTTP status code will be 200 also if all of the messages were successfully delivered to the Android and iOS push notification services.

**Important:** in particular, look for an `details` object with an `error` field inside both push tickets and push receipts. If present, it may be one of these values: `DeviceNotRegistered`, `MessageTooBig`, `MessageRateExceeded`, and `InvalidCredentials`. You should handle these errors like so:

- `DeviceNotRegistered`: the device cannot receive push notifications anymore and you should stop sending messages to the corresponding Expo push token.

- `MessageTooBig`: the total notification payload was too large. On Android and iOS the total payload must be at most 4096 bytes.

- `MessageRateExceeded`: you are sending messages too frequently to the given device. Implement exponential backoff and slowly retry sending messages.

- `InvalidCredentials`: your push notification credentials for your standalone app are invalid (ex: you may have revoked them). Run `expo build:ios -c` to regenerate new push notification credentials for iOS.

If Expo couldn't deliver the message to the Android or iOS push notification service, the receipt's details may also include service-specific information. This is useful mostly for debugging and reporting possible bugs to Expo.

### Expired Credentials

When your push notification credentials have expired, simply run `expo build:ios -c --no-publish` to clear your expired credentials and generate new ones. The new credentials will take effect within a few minutes of being generated. You do not have to submit a new build!

# FAQ

- **Does Expo store the contents of push notifications?** Expo does not store the contents of push notifications any longer than it takes to deliver the notifications to the push notification services operated by Apple, Google, etc... Push notifications are stored only in memory and in message queues and **not** stored in databases.

- **Does Expo read or share the contents of push notifications?** Expo does not read or share the contents of push notifications and our services keep push notifications only as long as needed to deliver them to push notification services run by Apple and Google. If the Expo team is actively debugging the push notifications service, we may see notification contents (ex: at a breakpoint) but Expo cannot see push notification contents otherwise.

- **How does Expo encrypt connections to push notification services, like Apple's and Google's?** Expo's connections to Apple and Google are encrypted and use HTTPS.

- **What browsers does Expo for Web's push notifications support?** It works on all browsers that support Push API such as Chrome and Firefox. Check the full list here: https://caniuse.com/#feat=push-api.

- **How do I handle expired push notification credentials?** When your push notification credentials have expired, simply run `expo build:ios -c --no-publish` to clear your expired credentials and generate new ones. The new credentials will take effect within a few minutes of being generated. You do not have to submit a new build!