---
title: Notifications
---

Provides access to remote notifications (also known as push notifications) and local notifications (scheduling and immediate) related functions.

## Installation

This API is pre-installed in [managed](../../introduction/managed-vs-bare/#managed-workflow) apps. It is not available for [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native apps, although there are some comparable libraries that you may use instead.

## API

```js
import { Notifications } from 'expo';
```

Check out [this Snack](https://snack.expo.io/@documentation/pushnotifications?platform=ios) to see Notifications in action, but be sure to use a physical device! Push notifications don't work on simulators/emulators. For Expo for Web, unless you're using localhost, your web page has to support HTTPS in order for notifications to work.

## Subscribing to Notifications

### `Notifications.addListener(listener)`

#### Arguments

- **listener (_function_)** -- A callback that is invoked when a remote or local notification is received or selected, with a Notification object.

#### Returns

An [EventSubscription](#eventsubscription) object that you can call remove() on when you would like to unsubscribe the listener.

### Related types

### `EventSubscription`

Returned from `addListener`.

- **remove() (_function_)** -- Unsubscribe the listener from future notifications.

### `Notification`

An object that is passed into each event listener when a notification is received:

- **origin (_string_)** -- Either `selected` or `received`. `selected` if the notification was tapped on by the user, `received` if the notification was received while the user was in the app.
- **data (_object_)** -- Any data that has been attached with the notification.
- **remote (_boolean_)** -- `true` if the notification is a push notification, `false` if it is a local notification.

## Notifications

### `Notifications.getExpoPushTokenAsync()`

#### Returns

Returns a Promise that resolves to a token string. This token can be provided to the Expo notifications backend to send a push notification to this device. [Read more in the Push Notifications guide](../../guides/push-notifications/#push-notifications).

The Promise will be rejected if the app does not have permission to send notifications. Be sure to check the result of `Permissions.askAsync(Permissions.NOTIFICATIONS)` before attempting to get an Expo push token.

#### Error Codes

- `E_NOTIFICATIONS_TOKEN_REGISTRATION_FAILED` - the device was unable to register for remote notifications with Expo.
- `E_NOTIFICATIONS_PUSH_WEB_MISSING_CONFIG` - (web only) you did not provide `owner`, `slug`, and `notification.vapidPublicKey` in `app.json` to use push notifications in Expo for Web. ([Learn more here](../../guides/using-vapid/))
- `E_NOTIFICATIONS_PUSH_WEB_TOKEN_REGISTRATION_FAILED` - (web only) the device was unable to register for remote notifications with the browser endpoint.

### `Notifications.presentLocalNotificationAsync(localNotification)`

Trigger a local notification immediately.

#### Arguments

- **localNotification (_object_)** -- An object with the properties described in [LocalNotification](#localnotification).

#### Returns

A Promise that resolves to a unique notification id.

### `Notifications.scheduleLocalNotificationAsync(localNotification, schedulingOptions)`

Schedule a local notification to fire at some specific time in the future or at a given interval.

#### Arguments

- **localNotification (_object_)** --

  An object with the properties described in [LocalNotification](#localnotification).

- **schedulingOptions (_object_)** --

  An object that describes when the notification should fire.

  - **time** (_date_ or _number_) -- A Date object representing when to fire the notification or a number in Unix epoch time. Example: `(new Date()).getTime() + 1000` is one second from now.
  - **repeat** (_optional_) (_string_) -- `'minute'`, `'hour'`, `'day'`, `'week'`, `'month'`, or `'year'`.
  - (_Android only_) **intervalMs** (_optional_) (_number_) -- Repeat interval in number of milliseconds

#### Returns

A Promise that resolves to a unique notification id.

### `Notifications.dismissNotificationAsync(localNotificationId)`

_Android only_. Dismisses the notification with the given id.

#### Arguments

- **localNotificationId (_number_)** -- A unique id assigned to the notification, returned from `scheduleLocalNotificationAsync` or `presentLocalNotificationAsync`.

### `Notifications.dismissAllNotificationsAsync()`

_Android only_. Clears any notifications that have been presented by the app.

### `Notifications.cancelScheduledNotificationAsync(localNotificationId)`

Cancels the scheduled notification corresponding to the given id.

#### Arguments

- **localNotificationId (_number_)** -- A unique id assigned to the notification, returned from `scheduleLocalNotificationAsync` or `presentLocalNotificationAsync`.

### `Notifications.cancelAllScheduledNotificationsAsync()`

Cancel all scheduled notifications.

## Notification categories

A notification category defines a set of actions with which a user may interact with and respond to the incoming notification. You can read more about categories [here (for iOS)](https://developer.apple.com/documentation/usernotifications/unnotificationcategory) and [here (for Android)](https://developer.android.com/guide/topics/ui/notifiers/notifications#Actions).

Check out how to implement interactive Notifications in your app by taking a look at the code behind [this Snack](https://snack.expo.io/@documentation/interactivenotificationexample)

### `Notifications.createCategoryAsync(name: string, actions: ActionType[])`

Registers a new set of actions under given `name`.

#### Arguments

- **name (_string_)** -- A string to assign as the ID of the category. When you present notifications later, you will pass this ID in order to associate them with your category.
- **actions (_array_)** -- An array of objects describing actions to associate to the category, of shape:
  - **actionId (_string_)** -- A unique identifier of the ID of the action. When a user executes your action, your app will receive this `actionId`.
  - **buttonTitle (_string_)** -- A title of the button triggering this action.
  - **textInput (_object_)** -- An optional object of shape: `{ submitButtonTitle: string, placeholder: string }`, which when provided, will prompt the user to enter a text value.
  - **isDestructive (_boolean_)** -- (iOS only) If this property is truthy, on iOS the button title will be highlighted (as if [this native option](https://developer.apple.com/documentation/usernotifications/unnotificationactionoptions/1648199-destructive) was set)
  - **isAuthenticationRequired (_boolean_)** -- (iOS only) If this property is truthy, triggering the action will require authentication from the user (as if [this native option](https://developer.apple.com/documentation/usernotifications/unnotificationactionoptions/1648196-authenticationrequired) was set)
  - **doNotOpenInForeground (_boolean_)** -- (iOS only) If this property is truthy, triggering the action will not open the app in foreground (as if [this native option](https://developer.apple.com/documentation/usernotifications/unnotificationactionoptions/unnotificationactionoptionforeground) was **NOT** set)

### `Notifications.deleteCategoryAsync(name: string)`

Deletes category for given `name`.

## Android channels

### `Notifications.createChannelAndroidAsync(id, channel)`

_Android only_. On Android 8.0+, creates a new notification channel to which local and push notifications may be posted. Channels are visible to your users in the OS Settings app as "categories", and they can change settings or disable notifications entirely on a per-channel basis. NOTE: after calling this method, you may no longer be able to alter the settings for this channel, and cannot fully delete the channel without uninstalling the app. Notification channels are required on Android 8.0+, but use this method with caution and be sure to plan your channels carefully.

According to the [Android docs](https://developer.android.com/training/notify-user/channels),

> You should create a channel for each distinct type of notification you need to send. You can also create notification channels to reflect choices made by users of your app. For example, you can set up separate notification channels for each conversation group created by a user in a messaging app.

On devices with Android 7.1 and below, Expo will "polyfill" channels for you by saving your channel's settings and automatically applying them to any notifications you designate with the `channelId`.

#### Arguments

- **id (_string_)** -- A unique string to assign as the ID of this channel. When you present notifications later, you will pass this ID in order to associate them with your channel.
- **channel (_object_)** -- An object with the properties described in [ChannelAndroid](#channelandroid).

### `Notifications.deleteChannelAndroidAsync(id)`

_Android only_. On Android 8.0+, deletes the notification channel with the given ID. Note that the OS Settings UI will display the number of deleted notification channels to the user as a spam prevention mechanism, so the only way to fully delete a channel is to uninstall the app or clearing all app data.

#### Arguments

- **id (_string_)** -- ID string of the channel to delete.

### Related types

#### LocalNotification

An object used to describe the local notification that you would like to present or schedule.

- **title (_string_)** -- title text of the notification
- **body (_string_)** -- body text of the notification.
- **data (_optional_) (_object_)** -- any data that has been attached with the notification.
- **categoryId (_optional_) (_string_)** -- ID of the category (first created with `Notifications.createCategoryAsync`) associated to the notification.
- **ios (_optional_) (_object_)** -- notification configuration specific to iOS.
  - **sound** (_optional_) (_boolean_) -- if `true`, play a sound. Default: `false`.
  - **_displayInForeground** (_optional_) (_boolean_) -- if `true`, display the notification when the app is foreground. Default: `false`.
- **android (_optional_) (_object_)** -- notification configuration specific to Android.
  - **channelId** (_optional, but recommended_) (_string_) -- ID of the channel to post this notification to in Android 8.0+. If null, defaults to the "Default" channel which Expo will automatically create for you. If you don't want Expo to create a default channel, make sure to always specify this field for all notifications.
  - **icon** (_optional_) (_string_) -- URL of icon to display in notification drawer.
  - **color** (_optional_) (_string_) -- color of the notification icon in notification drawer.
  - **sticky** (_optional_) (_boolean_) -- if `true`, the notification will be sticky and not dismissable by user. The notification must be programmatically dismissed. Default: `false`.
  - **link** (_optional_) (_string_) -- external link to open when notification is selected.

#### ChannelAndroid

An object used to describe an Android notification channel that you would like to create.

- **name (_string_)** -- user-facing name of the channel (or "category" in the Settings UI). Required.
- **description (_optional_) (_string_)** -- user-facing description of the channel, which will be displayed in the Settings UI.
- **sound (_optional_) (_boolean_)** -- if `true`, notifications posted to this channel will play a sound. Default: `false`.
- **priority (_optional_) (_min | low | default | high | max_)** -- Android may present notifications in this channel differently according to the priority. For example, a `high` priority notification will likely to be shown as a heads-up notification. Note that the Android OS gives no guarantees about the user-facing behavior these abstractions produce -- for example, on many devices, there is no noticeable difference between `high` and `max`.
- **vibrate (_optional_) (_boolean_ or _array_)** -- if `true`, vibrate the device whenever a notification is posted to this channel. An array can be supplied instead to customize the vibration pattern, e.g. - `[ 0, 500 ]` or `[ 0, 250, 250, 250 ]`. Default: `false`.
- **badge (_optional_) (_boolean_)** -- if `true`, unread notifications posted to this channel will cause the app launcher icon to be displayed with a badge on Android 8.0+. If `false`, notifications in this channel will never cause a badge. Default: `true`.

## App Icon Badge Number (iOS)

### `Notifications.getBadgeNumberAsync()`

#### Returns

Returns a promise that resolves to the number that is displayed in a badge on the app icon. This method returns zero when there is no badge (or when on Android).

### `Notifications.setBadgeNumberAsync(number)`

Sets the number displayed in the app icon's badge to the given number. Setting the number to zero will both clear the badge and the list of notifications in the device's notification center on iOS. On Android this method does nothing.

## Standalone App Only

### `Notifications.getDevicePushTokenAsync(config)`

Note: **This method is only available in standalone apps.** Most people do not need to use this. It is easier to use `getExpoPushTokenAsync` unless you have a specific reason to need the actual device tokens. We also don't guarantee that the iOS and Android clients will continue expecting the same push notification payload format.

Returns a native APNS, FCM or GCM token that can be used with another push notification service. If firebase cloud messaging is configured on your standalone Android app ([see guide here](../../guides/using-fcm/)), it will return an FCM token, otherwise it will return a GCM token.

#### Arguments

- **config (_object_)** -- An object with the following fields:
  - **gcmSenderId (_string_)** -- GCM sender ID.

#### Returns

A Promise that resolves to an object with the following fields:

- **type (_string_)** -- Either "apns", "fcm", or "gcm".
- **data (_string_)** -- The push token as a string.

#### Error Codes

- `E_NOTIFICATIONS_PUSH_WEB_MISSING_CONFIG` - (web only) you did not provide `owner`, `slug`, and `notification.vapidPublicKey` in `app.json` to use push notifications in Expo for Web. ([Learn more here](../../guides/using-vapid/))
- `E_NOTIFICATIONS_PUSH_WEB_TOKEN_REGISTRATION_FAILED` - (web only) the device was unable to register for remote notifications with the browser endpoint.

## Error Codes

| Code                                               | Description                                                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| E_NOTIFICATIONS_TOKEN_REGISTRATION_FAILED          | The device was unable to register for remote notifications with Expo.                            |
| E_NOTIFICATIONS_PUSH_WEB_MISSING_CONFIG            | (Web only) You did not provide `owner`, `slug`, and `notification.vapidPublicKey` in `app.json` to use push notifications in Expo for Web. ([Learn more here](../../guides/using-vapid/)) |
| E_NOTIFICATIONS_PUSH_WEB_TOKEN_REGISTRATION_FAILED | (Web only) The device was unable to register for remote notifications with the browser endpoint. |
