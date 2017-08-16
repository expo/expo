---
title: Notifications
---

Provides access to remote notifications (also known as push notifications) and local notifications (scheduling and immediate) related functions.

## Subscribing to Notifications

### `Expo.Notifications.addListener(listener)`

#### Arguments

-   **listener (_function_)** -- A callback that is invoked when a remote or local notification is received or selected, with a Notification object.

#### Returns

An [EventSubscription](#eventsubscription) object that you can call remove() on when you would like to unsubscribe the listener.

### Related types

### `EventSubscription`

Returned from `addListener`.

-   **remove() (_function_)** -- Unsubscribe the listener from future notifications.
    `Notification`

An object that is passed into each event listener when a notification is received:

-   **origin (_string_)** -- Either `selected` or `received`. `selected` if the notification was tapped on by the user, `received` if the notification was received while the user was in the app.
-   **data (_object_)** -- Any data that has been attached with the notification.
-   **remote (_boolean_)** -- `true` if the notification is a push notification, `false` if it is a local notification.

## Remote (Push) Notifications

### `Expo.Notifications.getExpoPushTokenAsync()`

#### Returns

Returns a Promise that resolves to a token string. This token can be provided to the Expo notifications backend to send a push notification to this device. [Read more in the Push Notifications guide](../guides/push-notifications.html#push-notifications).

## Local Notifications

### `Expo.Notifications.presentLocalNotificationAsync(localNotification)`

Trigger a local notification immediately.

#### Arguments

-   **localNotification (_object_)** -- An object with the properties described in [LocalNotification](#LocalNotification).

#### Returns

A Promise that resolves to a unique notification id.

### `Expo.Notifications.scheduleLocalNotificationAsync(localNotification, schedulingOptions)`

Schedule a local notification to fire at some specific time in the future or at a given interval.

#### Arguments

-   **localNotification (_object_)** --

      An object with the properties described in [LocalNotification](#LocalNotification).

-   **schedulingOptions (_object_)** --

      An object that describes when the notification should fire.

    -   **time** (_date_ or _number_) -- A Date object representing when to fire the notification or a number in Unix epoch time. Example: `(new Date()).getTime() + 1000` is one second from now.
    -   **repeat** (_optional_) (_string_) -- `'minute'`, `'hour'`, `'day'`, `'week'`, `'month'`, or `'year'`.
    - (_Android only_) **intervalMs** (_optional_) (_number_) -- Repeat interval in number of milliseconds

#### Returns

A Promise that resolves to a unique notification id.

### `Expo.Notifications.dismissNotificationAsync(localNotificationId)`

_Android only_. Dismisses the notification with the given id.

#### Arguments

-   **localNotificationId (_number_)** -- A unique id assigned to the notification, returned from `scheduleLocalNotificationAsync` or `presentLocalNotificationAsync`.

### `Expo.Notifications.dismissAllNotificationsAsync()`

_Android only_. Clears any notifications that have been presented by the app.

### `Expo.Notifications.cancelScheduledNotificationAsync(localNotificationId)`

Cancels the scheduled notification corresponding to the given id.

#### Arguments

-   **localNotificationId (_number_)** -- A unique id assigned to the notification, returned from `scheduleLocalNotificationAsync` or `presentLocalNotificationAsync`.

### `Expo.Notifications.cancelAllScheduledNotificationsAsync()`

Cancel all scheduled notifications.

### Related types

 `LocalNotification`
An object used to describe the local notification that you would like to present or schedule.

-   **title (_string_)** -- title text of the notification
-   **body (_string_)** -- body text of the notification.
-   **data (_optional_) (_object_)** -- any data that has been attached with the notification.
-   **ios (_optional_) (_object_)** -- notification configuration specific to iOS.
    -   **sound** (_optional_) (_boolean_) -- if `true`, play a sound. Default: `false`.
-   **android (_optional_) (_object_)** -- notification configuration specific to Android.
    -   **sound** (_optional_) (_boolean_) -- if `true`, play a sound. Default: `false`.
    -   **icon** (_optional_) (_string_) -- URL of icon to display in notification drawer.
    -   **color** (_optional_) (_string_) -- color of the notification icon in notification drawer.
    -   **priority** (_optional_) (_min | low | high | max_) -- android may present notifications according to the priority, for example a `high` priority notification will likely to be shown as a heads-up notification.
    -   **sticky** (_optional_) (_boolean_) -- if `true`, the notification will be sticky and not dismissable by user. The notification must be programmatically dismissed. Default: `false`.
    -   **vibrate** (_optional_) (_boolean_ or _array_) -- if `true`, vibrate the device. An array can be supplied to specify the vibration pattern, e.g. - `[ 0, 500 ]`.
    -   **link** (_optional_) (_string_) -- external link to open when notification is selected.

## App Icon Badge Number (iOS)

### `Expo.Notifications.getBadgeNumberAsync()`

#### Returns

Returns a promise that resolves to the number that is displayed in a badge on the app icon. This method returns zero when there is no badge (or when on Android).

### `Expo.Notifications.setBadgeNumberAsync(number)`

Sets the number displayed in the app icon's badge to the given number. Setting the number to zero will both clear the badge and the list of notifications in the device's notification center on iOS. On Android this method does nothing.
