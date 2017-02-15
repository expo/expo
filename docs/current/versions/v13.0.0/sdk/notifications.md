---
title: Notifications
old_permalink: /versions/v12.0.0/sdk/notifications.html
previous___FILE: ./map-view.md
next___FILE: ./permissions.md

---

Provides access to remote notifications (also known as push notifications) and local notifications (scheduling and immediate) related functions.

## Subscribing to Notifications

### `Exponent.Notifications.addListener(listener)`
#### Arguments

* **listener (_function_)** -- A callback that is invoked when a remote or local notification is received or selected, with a [Notification](https://docs.getexponent.com/versions/v12.0.0/guides#Notification) object.

#### Returns
An [EventSubscription](https://docs.getexponent.com/versions/v12.0.0/EventSubscription) object that you can call remove() on when you would like to unsubscribe the listener.

### Related types

`EventSubscription`

Returned from `addListener`.

* **remove() (_function_)** -- Unsubscribe the listener from future notifications.
 
 `Notification`

An object that is passed into each event listener when a notification is received:

* **origin (_string_)** -- Either `selected` or `received`. `selected` if the notification was tapped on by the user, `received` if the notification was received while the user was in the app.
* **data (_object_)** -- Any data that has been attached with the notification.
* **remote (_boolean_)** -- `true` if the notification is a push notification, `false` if it is a local notification.

## Remote (Push) Notifications

### `Exponent.Notifications.getExponentPushTokenAsync()`  
#### Returns
Returns a Promise that resolves to a token string. This token can be provided to the Exponent notifications backend to send a push notification to this device. [Read more in the Push Notifications guide](https://docs.getexponent.com/versions/guides/push-notifications.html#push-notifications).

## Local Notifications

### `Exponent.Notifications.presentLocalNotificationAsync(localNotification)`
Trigger a local notification immediately.

#### Arguments

* **localNotification (_object_)** -- An object with the properties described in [LocalNotification](https://docs.getexponent.com/versions/v12.0.0/guides#LocalNotification).

#### Returns
A Promise that resolves to a unique notification id.

 
### `Exponent.Notifications.scheduleLocalNotificationAsync(localNotification, schedulingOptions)`
Schedule a local notification to fire at some specific time in the future or at a given interval.

#### Arguments

* **localNotification (_object_)** --

    An object with the properties described in [LocalNotification](https://docs.getexponent.com/versions/v12.0.0/guides#LocalNotification).

* **schedulingOptions (_object_)** --

    An object that describes when the notification should fire.

    -   **time** (_date_ or _number_) -- A Date object representing when to fire the notification or a number in Unix epoch time. Example: `(new Date()).getTime() + 1000` is one second from now.
    -   **repeat** (_optional_) (_string_) -- `'minute'`, `'hour'`, `'day'`, `'week'`, `'month'`, or `'year'`.

#### Returns
A Promise that resolves to a unique notification id.

 
### `Exponent.Notifications.dismissNotificationAsync(localNotificationId)`
_Android only_. Dismisses the notification with the given id.

#### Arguments

* **localNotificationId (_number_)** -- A unique id assigned to the notification, returned from `scheduleLocalNotificationAsync` or `presentLocalNotificationAsync`.

 
### `Exponent.Notifications.dismissAllNotificationsAsync()`  
_Android only_. Clears any notificatons that have been presented by the app.

 
### `Exponent.Notifications.cancelScheduledNotificationAsync(localNotificationId)`
Cancels the scheduled notification corresponding to the given id.

#### Arguments

* **localNotificationId (_number_)** -- A unique id assigned to the notification, returned from `scheduleLocalNotificationAsync` or `presentLocalNotificationAsync`.

 
### `Exponent.Notifications.cancelAllScheduledNotificationsAsync()`  
Cancel all scheduled notifications.

### Related types

 `LocalNotification`  
An object used to describe the local notification that you would like to present or schedule.

* **title (_string_)** -- Either `selected` or `received`. `selected` if the notification was tapped on by the user, `received` if the notification was received while the user was in the app.
* **data (_optional_) (_object_)** -- Any data that has been attached with the notification.
* **ios (_optional_) (_object_)** -- notification configuration specific to iOS.
    -   **sound** (_optional_) (_boolean_) -- if `true`, play a sound. Default: `false`.
* **android (_optional_) (_object_)** -- notification configuration specific to Android.
    -   **icon** (_optional_) (_string_)
    -   **color** (_optional_) (_string_)
    -   **priority** (_optional_) (_string_)
    -   **sticky** (_optional_) (_boolean_)
    -   **vibrate** (_optional_) (_boolean_ or _array_)
    -   **link** (_optional_) (_array_)
