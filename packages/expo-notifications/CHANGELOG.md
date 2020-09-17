# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 0.7.2 — 2020-09-17

### 🐛 Bug fixes

- Fixed case where Android apps could crash if you set a new category with a text input action **without** providing any `options`. ([#10141](https://github.com/expo/expo/pull/10141) by [@cruzach](https://github.com/cruzach))
- Android apps no longer rely on the `submitButtonTitle` property as the action button title (they rely on `buttonTitle`, which matches iOS behavior). ([#10141](https://github.com/expo/expo/pull/10141) by [@cruzach](https://github.com/cruzach))

## 0.7.1 — 2020-08-26

_This version does not introduce any user-facing changes._

## 0.7.0 — 2020-08-18

### 🎉 New features

- Added permissions support for web. ([#9576](https://github.com/expo/expo/pull/9576) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fix scheduled notifications not being displayed after five minutes of phone inactivity on Android. ([#9816](https://github.com/expo/expo/pull/9816) by [@sjchmiela](https://github.com/sjchmiela))
- Fixed case where iOS notification category would not be set on the very first call to `setNotificationCategoryAsync`. ([#9515](https://github.com/expo/expo/pull/9515) by [@cruzach](https://github.com/cruzach))
- Fixed notification response listener not triggering in the managed workflow on iOS when app was completely killed ([#9478](https://github.com/expo/expo/pull/9478) by [@cruzach](https://github.com/cruzach))
- Fixed notifications being displayed when `shouldShowAlert` was `false` on Android. ([#9563](https://github.com/expo/expo/pull/9563) by [@barthap](https://github.com/barthap))
- Fixed `Application Not Responding` occurring in the Google Play Console. ([#9792](https://github.com/expo/expo/pull/9792) by [@lukmccall](https://github.com/lukmccall))

## 0.6.0 — 2020-07-29

### 🎉 New features

- Added Notification categories functionality to allow for interactive push notifications on Android and iOS! ([#9015](https://github.com/expo/expo/pull/9015) by [@cruzach](https://github.com/cruzach))
- Added support for channels to local notifications. ([#9385](https://github.com/expo/expo/pull/9385) by [@lukmccall](https://github.com/lukmccall))

## 0.5.0 — 2020-07-27

### 🎉 New features

- Added support for custom large icon on the Android. ([#9116](https://github.com/expo/expo/pull/9116) by [@lukmccall](https://github.com/lukmccall))
- Added `sticky` property, which defines if notification can be dismissed by swipe. ([#9351](https://github.com/expo/expo/pull/9351) by [@barthap](https://github.com/barthap))

### 🐛 Bug fixes

- Fix notifications not being displayed after five minutes of phone inactivity on Android. ([#9287](https://github.com/expo/expo/pull/9287) by [@mczernek](https://github.com/mczernek))
- Include `content-type: application/json` when requesting an Expo push token ([#9332](https://github.com/expo/expo/pull/9332) by @ide)
- Export `NotificationPermissions.types` to make `Notifications.IosAuthorizationStatus` available. ([#8747](https://github.com/expo/expo/pull/8747) by [@brentvatne](https://github.com/brentvatne))
- Fixed remote notifications ignoring the `channelId` parameter. ([#9080](https://github.com/expo/expo/pull/9080) by [@lukmccall](https://github.com/lukmccall))
- Fixed malformed data object on iOS. ([#9164](https://github.com/expo/expo/pull/9164) by [@lukmccall](https://github.com/lukmccall))

## 0.4.0 — 2020-06-24

### 🎉 New features

- Added `IosAuthorizationStatus.EPHEMERAL`, an option that maps to `UNAuthorizationStatusEphemeral` for compatibility with iOS 14. ([#8938](https://github.com/expo/expo/pull/8938) by [@ide](https://github.com/ide))

### 🐛 Bug fixes

- Fixed total incompatibility with the web platform – calling unsupported methods will now throw a readable `UnavailabilityError`. ([#8853](https://github.com/expo/expo/pull/8853) by [@sjchmiela](https://github.com/sjchmiela))

## 0.3.2 — 2020-06-10

### 🐛 Bug fixes

- Fixed compatibility with `expo-permissions` below `9.0.0` (the _duplicate symbols_ problem). ([#8753](https://github.com/expo/expo/pull/8753) by [@sjchmiela](https://github.com/sjchmiela))

## 0.3.1 — 2020-06-03

### 🎉 New features

- Added support for including foreign (non-`expo-notifications`-created) notifications in `getPresentedNotificationsAsync` on Android. ([#8614](https://github.com/expo/expo/pull/8614) by [@sjchmiela](https://github.com/sjchmiela))

### 🐛 Bug fixes

- Fixed `getExpoPushTokenAsync` rejecting when `getDevicePushTokenAsync`'s `Promise` hasn't fulfilled yet (and vice versa). Probably also added support for calling these methods reliably with Fast Refresh enabled. ([#8608](https://github.com/expo/expo/pull/8608) by [@sjchmiela](https://github.com/sjchmiela))

## 0.3.0 — 2020-05-28

### 🎉 New features

- Added native permission requester that will let developers call `Permissions.getAsync(Permissions.NOTIFICATIONS)` (or `askAsync`) when this module is installed. ([#8486](https://github.com/expo/expo/pull/8486) by [@sjchmiela](https://github.com/sjchmiela))

> Note that the effect of this method is the same as if you called `Notifications.getPermissionsAsync()` (or `requestPermissionsAsync`) and then `Notifications.getDevicePushTokenAsync()`—it tries to both ask the user for user-facing notifications permissions and then tries to register the device for remote notifications. We are planning to deprecate the `.NOTIFICATIONS` permission soon.## 0.2.0 — 2020-05-27### 🛠 Breaking changes> Note that this may or may not be a breaking change for you — if you'd expect the notification to be automatically dismissed when tapped on this is a bug fix and a new feature (fixes inconsistency between platforms as on iOS this is the only supported behavior; adds the ability to customize the behavior on Android). If you'd expect the notification to only be dismissed at your will this is a breaking change and you'll need to add `autoDismiss: false` to your notification content inputs.- Changed the default notification behavior on Android to be automatically dismissed when clicked. This is customizable with the `autoDismiss` parameter of `NotificationContentInput`. ([#8241](https://github.com/expo/expo/pull/8241) by [@thorbenprimke](https://github.com/thorbenprimke))### 🎉 New features- Added the ability to configure whether the notification should be automatically dismissed when tapped on or not (on Android) with the `autoDismiss` parameter of `NotificationContentInput`. ([#8241](https://github.com/expo/expo/pull/8241) by [@thorbenprimke](https://github.com/thorbenprimke))
- Added `DailyTriggerInput` that allows scheduling a daily recurring notification for a specific hour and minute. It is supported on both iOS and Android. ([#8199](https://github.com/expo/expo/pull/8199) by [@thorbenprimke](https://github.com/thorbenprimke))

### 🐛 Bug fixes

- Added a macro check for `UNLocationNotificationTrigger` to make this module compatible with Mac Catalyst ([#8171](https://github.com/expo/expo/pull/8171) by [@robertying](https://github.com/robertying))
- Fixed notification content text being truncated without the ability to expand the notification by adding [`BigTextStyle`](https://developer.android.com/reference/android/app/Notification.BigTextStyle) to all Android notifications, which allows them to be expanded and their content text fully viewed ([#8140](https://github.com/expo/expo/pull/8140) by [@thorbenprimke](https://github.com/thorbenprimke))
- Added a check for trigger input that throws an error if user misuses the `seconds` property ([#8261](https://github.com/expo/expo/pull/8261) by [@sjchmiela](https://github.com/sjchmiela))

## 0.1.7 - 2020-05-05

### 🐛 Bug fixes

- Fixed obsolete and invalid dependency on `>= @unimodules/core@5.1.1`, bringing backwards compatibility with older versions of `@unimodules/core` ([#8162](https://github.com/expo/expo/pull/8162) by [@sjchmiela](https://github.com/sjchmiela))

## 0.1.6 - 2020-05-05

### 🐛 Bug fixes

- Fixed crash when serializing a notification containing a `null` value ([#8153](https://github.com/expo/expo/pull/8153) by [@sjchmiela](https://github.com/sjchmiela))
- Fixed a typo in `AndroidImportance` enum (`DEEFAULT` is now deprecated in favor of `DEFAULT`) ([#8161](https://github.com/expo/expo/pull/8161) by [@trevorah](https://github.com/trevorah))

## 0.1.5 - 2020-05-05

### 🐛 Bug fixes

- Fixed the ability to override the `FirebaseListenerService` without having to add a custom priority. ([#8175](https://github.com/expo/expo/pull/8175) by [@lukmccall](https://github.com/lukmccall))
- Fixed `SoundResolver` causing crash if the `sound` property is not defined or doesn't contain a `.` ([#8150](https://github.com/expo/expo/pull/8150) by [@sjchmiela](https://github.com/sjchmiela))

## 0.1.4 - 2020-05-04

### 🎉 New features

- Added a native setting allowing you to use a custom notification icon for Android notifications ([#8035](https://github.com/expo/expo/pull/8035) by [@sjchmiela](https://github.com/sjchmiela))
- Added a native setting and a runtime option allowing you to use a custom notification color for Android notifications ([#8035](https://github.com/expo/expo/pull/8035) by [@sjchmiela](https://github.com/sjchmiela))

### 🐛 Bug fixes

- Fixed initial notification not being emitted to `NotificationResponse` listener on iOS ([#7958](https://github.com/expo/expo/pull/7958) by [@sjchmiela](https://github.com/sjchmiela))

## 0.1.3 - 2020-04-30

### 🐛 Bug fixes

- Fixed custom notification sounds not being applied properly to notifications and channels ([#8036](https://github.com/expo/expo/pull/8036) by [@sjchmiela](https://github.com/sjchmiela))
- Fixed iOS rejecting the Promise to schedule a notification if `sound` is not empty or a boolean ([#8036](https://github.com/expo/expo/pull/8036) by [@sjchmiela](https://github.com/sjchmiela))

## 0.1.2 - 2020-04-21

### 🐛 Bug fixes

- Fixed interpretation of `Date` and `number` triggers when calling `scheduleNotificationAsync` on iOS ([#7942](https://github.com/expo/expo/pull/7942) by [@sjchmiela](https://github.com/sjchmiela))
