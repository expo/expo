# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 0.14.1 — 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 0.14.0 — 2021-12-03

### 💡 Others

- Update `fs-extra` dependency. ([#15069](https://github.com/expo/expo/pull/15069) by [@Simek](https://github.com/Simek))

## 0.13.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 0.13.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🎉 New features

- Update JS code to read manifest2 when manifest is not available. ([#13602](https://github.com/expo/expo/pull/13602) by [@wschurman](https://github.com/wschurman))
- Add usePermissions hook from modules factory. ([#13863](https://github.com/expo/expo/pull/13863) by [@bycedric](https://github.com/bycedric))

### 🐛 Bug fixes

- Fixed Android notifications not respecting the `shouldPlaySound` property in `setNotificationHandler`. ([#13411](https://github.com/expo/expo/pull/13411) by [@cruzach](https://github.com/cruzach))
- Force device ID to lowercase before sending to Expo's servers. (Only applicable if you're using `ExpoPushToken`s). ([#13409](https://github.com/expo/expo/pull/13409) by [@cruzach](https://github.com/cruzach))
- Fixed plugin to not throw if the notification icon isn't set, and there's no notification icon present in the Android project. ([#13539](https://github.com/expo/expo/pull/13539) by [@cruzach](https://github.com/cruzach))
- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Updated `@expo/config-plugins`, `@expo/image-utils` ([#14443](https://github.com/expo/expo/pull/14443) by [@EvanBacon](https://github.com/EvanBacon))

## 0.12.0 — 2021-06-16

### 🎉 New features

- [plugin] Refactor imports ([#13029](https://github.com/expo/expo/pull/13029) by [@EvanBacon](https://github.com/EvanBacon))
- Add support for custom notification sounds when using EAS Build. ([#12782](https://github.com/expo/expo/pull/12782) by [@cruzach](https://github.com/cruzach))
- Added ability to respond to remote notifications received while the app is backgrounded. ([#13130](https://github.com/expo/expo/pull/13130) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))
- Add new manifest2 field and make existing field optional. ([#12817](https://github.com/expo/expo/pull/12817) by [@wschurman](https://github.com/wschurman))
- Use originalFullName instead of currentFullName ([#12953](https://github.com/expo/expo/pull/12953)) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Migrated from `unimodules-permissions-interface` to `expo-modules-core`. ([#12961](https://github.com/expo/expo/pull/12961) by [@tsapeta](https://github.com/tsapeta))
- Refactored uuid imports to v7 style. ([#13037](https://github.com/expo/expo/pull/13037) by [@giautm](https://github.com/giautm))

## 0.11.5 — 2021-04-13

_This version does not introduce any user-facing changes._

## 0.11.4 — 2021-04-09

### 🎉 New features

- Add bare workflow support to `getExpoPushTokenAsync`. ([#12465](https://github.com/expo/expo/pull/12465) by [@EvanBacon](https://github.com/EvanBacon))

## 0.11.3 — 2021-03-31

_This version does not introduce any user-facing changes._

## 0.11.2 — 2021-03-30

### 🐛 Bug fixes

- Fixed an issue on Android where dismissing notifications by ID inside of Expo Go did nothing. ([#12306](https://github.com/expo/expo/pull/12306 by [@cruzach](https://github.com/cruzach))

## 0.11.1 — 2021-03-23

### 🎉 New features

- Expose `getLastNotificationResponseAsync` method (non-hook version of `useLastNotificationResponse`).

### 🐛 Bug fixes

- Prevent scoped category IDs from being returned from `setNotificationCategoryAsync`. ([#12212](https://github.com/expo/expo/pull/12212 by [@cruzach](https://github.com/cruzach))

## 0.11.0 — 2021-03-10

### 🎉 New features

- Allow for remote notifications to overwrite notifications already existing in the tray. ([#12050](https://github.com/expo/expo/pull/12050) and [#12055](https://github.com/expo/expo/pull/12055) by [@cruzach](https://github.com/cruzach))
- Notifications from different experiences in Expo Go can no longer overwrite each other. ([#12050](https://github.com/expo/expo/pull/12050) and [#12055](https://github.com/expo/expo/pull/12055) by [@cruzach](https://github.com/cruzach))

## 0.10.0 — 2021-03-03

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))
- Added `YearlyTriggerInput` that allows scheduling a yearly recurring notification for a specific day of the year, hour and minute. It is supported on both iOS and Android. ([#11898](https://github.com/expo/expo/pull/11898) by [@raulmt](https://github.com/raulmt))

### 🐛 Bug fixes

- Notification categories will no longer be lost after ejecting to the bare workflow (if ejecting after SDK 41). ([#11651](https://github.com/expo/expo/pull/11651) by [@cruzach](https://github.com/cruzach))
- Notify all listeners of pending notification responses. ([#11536](https://github.com/expo/expo/pull/11536) by [@esamelson](https://github.com/esamelson))

## 0.9.0 — 2021-01-15

### ⚠️ Notices

- The package is now shipped with prebuilt binaries on iOS. You can read more about it on [expo.fyi/prebuilt-modules](https://expo.fyi/prebuilt-modules). ([#11224](https://github.com/expo/expo/pull/11224) by [@tsapeta](https://github.com/tsapeta))

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))
- When migrating installation identifier (used internally to fetch Expo push token) `expo-notifications` will now remove existing `SharedPreferences` entry, if the migrated identifier comes from there. This may cause issues in bare workflow projects if `expo-constants` is installed in version lower than `10.0.0`. **Please upgrade `expo-constants` in your project to at least `10.0.0` when installing new versions of `expo-notifications`. If you do not upgrade `expo-constants`, its `.installationId` may change.** ([#11283](https://github.com/expo/expo/pull/11283) by [@sjchmiela](https://github.com/sjchmiela))

### 🎉 New features

- Created config plugin. ([#11633](https://github.com/expo/expo/pull/11633) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fixed a case where `requestPermissionsAsync` would ignore the provided `NotificationPermissionsRequest`. ([#11548](https://github.com/expo/expo/pull/11548) by [@cruzach](https://github.com/cruzach))
- Fixed case on Android where `getPermissionsAsync` would always return `canAskAgain: true`. ([#11551](https://github.com/expo/expo/pull/11551) by [@cruzach](https://github.com/cruzach))
- Fixed migration process to **not** use `expo-constants` installation ID if there is a notifications-specific identifier. ([#11287](https://github.com/expo/expo/pull/11287) by [@sjchmiela](https://github.com/sjchmiela))
- Native iOS notifications emitter module no longer registers for notification events as soon as module registry is ready which fixes initial notification response not being delivered to JS in standalone (Expo managed workflow) iOS apps. ([#11382](https://github.com/expo/expo/pull/11382) by [@sjchmiela](https://github.com/sjchmiela))
- Changed the visibility of Android's `InstallationId#getNonBackedUpUuidFile` method so it's easier to override by custom implementations. ([#11249](https://github.com/expo/expo/pull/11249) by [@sjchmiela](https://github.com/sjchmiela))
- Added extra check for marking pending notification responses as delivered which prevents legacy Expo notifications to consume notification responses when we don't want it to which should help fix initial notification response (causing the application to start) not being delivered (only in iOS standalone applications in Expo managed workflow). ([#11378](https://github.com/expo/expo/pull/11378) by [@sjchmiela](https://github.com/sjchmiela))
- Removed `fbjs` dependency ([#11396](https://github.com/expo/expo/pull/11396) by [@cruzach](https://github.com/cruzach))

## 0.8.2 — 2020-11-30

### 🐛 Bug fixes

- Added `assert` as a package dependency. ([#11171](https://github.com/expo/expo/pull/11171) by [@cruzach](https://github.com/cruzach))

## 0.8.1 — 2020-11-25

_This version does not introduce any user-facing changes._

## 0.8.0 — 2020-11-17

### 🛠 Breaking changes

- Changed the way `PermissionResponse.status` is calculated on iOS. Previously, it returns the numeric value of `UMPermissionStatus` which does not match the TypeScript enum declaration. ([#10513](https://github.com/expo/expo/pull/10513) by [@cHaLkdusT](https://github.com/cHaLkdusT))
- Changed the way `NotificationContent.data` is calculated on iOS. Previously it was the contents of remote notification payload with all entries from under `"body"` moved from under `"body"` to root level. Now it's the sole unchanged contents of `payload["body"]`. Other fields of the payload can now be accessed on iOS through `PushNotificationTrigger.payload` (similarly to how other fields of native remote message can be accessed on Android under `PushNotificationTrigger.remoteMessage`). ([#10453](https://github.com/expo/expo/pull/10453) by [@sjchmiela](https://github.com/sjchmiela))
- Changed class responsible for handling Firebase events from `FirebaseMessagingService` to `.service.NotificationsService` on Android. ([#10558](https://github.com/expo/expo/pull/10558) by [@sjchmiela](https://github.com/sjchmiela))

  > Note that this change most probably will not affect you — it only affects projects that override `FirebaseMessagingService` to implement some custom handling logic.
- Changed how you can override ways in which a notification is reinterpreted from a [`StatusBarNotification`](https://developer.android.com/reference/android/service/notification/StatusBarNotification) and in which a [`Notification`](https://developer.android.com/reference/android/app/Notification.html?hl=en) is built from defining an `expo.modules.notifications#NotificationsScoper` meta-data value in `AndroidManifest.xml` to implementing a `BroadcastReceiver` subclassing `NotificationsService` delegating those responsibilities to your custom `PresentationDelegate` instance. ([#10558](https://github.com/expo/expo/pull/10558) by [@sjchmiela](https://github.com/sjchmiela))

  > Note that this change most probably will not affect you — it only affects projects that override those methods to implement some custom handling logic.
- Removed `removeAllNotificationListeners` method. You can (and should) still remove listeners using `remove` method on `Subscription` objects returned by `addNotification…Listener`. ([#10883](https://github.com/expo/expo/pull/10883) by [@sjchmiela](https://github.com/sjchmiela))
- Fixed device identifier being used to fetch Expo push token being backed up on Android which resulted in multiple devices having the same `deviceId` (and eventually, Expo push token). ([#11005](https://github.com/expo/expo/pull/11005) by [@sjchmiela](https://github.com/sjchmiela))
- Fixed device identifier used when fetching Expo push token being different than `Constants.installationId` in managed workflow apps which resulted in different Expo push tokens returned for the same experience across old and new Expo API and the device push token not being automatically updated on Expo push servers which lead to Expo push tokens corresponding to outdated Firebase tokens. ([#11005](https://github.com/expo/expo/pull/11005) by [@sjchmiela](https://github.com/sjchmiela))
- Removed `removeAllPushTokenListeners` method. You can (and should) still remove listeners using `remove` method on `Subscription` objects returned by `addPushTokenListener`. ([#11106](https://github.com/expo/expo/pull/11106) by [@sjchmiela](https://github.com/sjchmiela))

### 🎉 New features

- Added `useLastNotificationResponse` React hook that always returns the notification response that has been emitted most recently. ([#10883](https://github.com/expo/expo/pull/10883) by [@sjchmiela](https://github.com/sjchmiela))
- Added `WeeklyTriggerInput` that allows scheduling a weekly recurring notification for a specific day of week, hour and minute. It is supported on both iOS and Android. ([#9973](https://github.com/expo/expo/pull/9973) by [@RikTheunis](https://github.com/riktheunis))
- Added `getNextTriggerDateAsync` method allowing you to verify manually when would the next trigger date for a particular notification trigger be. ([#10455](https://github.com/expo/expo/pull/10455) by [@sjchmiela](https://github.com/sjchmiela))
- Added support for restoring scheduled notifications alarms on Android after an app is updated. ([#10708](https://github.com/expo/expo/pull/10708) by [@sjchmiela](https://github.com/sjchmiela))
- Added support for auto server reregistration for Expo push tokens (keeping Expo push token always valid) and auto server registration customizations. ([#10908](https://github.com/expo/expo/pull/10908) by [@sjchmiela](https://github.com/sjchmiela))

### 🐛 Bug fixes

- Fixed TypeScript definition: `setNotificationCategoryAsync` should expect `options.allowAnnouncement`, **not** `options.allowAnnouncment`. ([#11025](https://github.com/expo/expo/pull/11025) by [@cruzach](https://github.com/cruzach))
- Fixed issue where custom notification icon and color weren't being properly applied in Android managed workflow apps. ([#10828](https://github.com/expo/expo/pull/10828) by [@cruzach](https://github.com/cruzach))
- Fixed case where Android managed workflow apps could crash when receiving an interactive notification. ([#10608](https://github.com/expo/expo/pull/10608) by [@cruzach](https://github.com/cruzach))
- Fixed case where Android apps could crash if you set a new category with a text input action **without** providing any `options`. ([#10141](https://github.com/expo/expo/pull/10141) by [@cruzach](https://github.com/cruzach))
- Android apps no longer rely on the `submitButtonTitle` property as the action button title (they rely on `buttonTitle`, which matches iOS behavior). ([#10141](https://github.com/expo/expo/pull/10141) by [@cruzach](https://github.com/cruzach))
- Fixed `Notifications.requestPermissions()` returning `undetermined` instead of a known status in some browsers. ([#10296](https://github.com/expo/expo/pull/10296) by [@sjchmiela](https://github.com/sjchmiela))
- Fixed crashing when Proguard is enabled. ([#10421](https://github.com/expo/expo/pull/10421) by [@lukmccall](https://github.com/lukmccall))
- Fixed the application icon being always added as a notification icon. ([#10471](https://github.com/expo/expo/pull/10471) by [@lukmccall](https://github.com/lukmccall))
- Fixed faulty trigger detection mechanism which caused some triggers with `channelId` specified get recognized as triggers of other types. ([#10454](https://github.com/expo/expo/pull/10454) by [@sjchmiela](https://github.com/sjchmiela))
- Fixed fatal exception sometimes being thrown when notification was received or tapped on Android due to observer being cleared before it's added. ([#10640](https://github.com/expo/expo/pull/10640) by [@sjchmiela](https://github.com/sjchmiela))
- Removed the large icon from managed workflow. ([#10492](https://github.com/expo/expo/pull/10492) by [@lukmccall](https://github.com/lukmccall))
- Fixed crash happening due to non-existent `ExpoNotificationsService` being declared in `AndroidManifest.xml`. ([#10638](https://github.com/expo/expo/pull/10638) by [@sjchmiela](https://github.com/sjchmiela))
- Fixed notifications _not_ playing any sound when `shouldShowAlert: false` but `shouldPlaySound: true` in `setNotificationHandler`. ([#10699](https://github.com/expo/expo/pull/10699) by [@cruzach](https://github.com/cruzach))
- Add guard against badgin usage in SSR environments. ([#10741](https://github.com/expo/expo/pull/10741) by [@bycedric](https://github.com/bycedric))
- Moved notification events handling from main thread to a background thread which makes users' devices more responsive. ([#10762](https://github.com/expo/expo/pull/10762) by [@sjchmiela](https://github.com/sjchmiela))
- Fixed having to define `CATEGORY_DEFAULT` on an `Activity` that is expected to receive `expo.modules.notifications.OPEN_APP_ACTION` intent when handling notification response. ([#10755](https://github.com/expo/expo/pull/10755) by [@sjchmiela](https://github.com/sjchmiela))
- Fixed notifications not being returned at all from `getAllPresentedNotificationsAsync()` if the library fails to reconstruct notification request based on marshaled copy in notification data. From now on they'll be naively reconstructed from the Android notification. ([#10801](https://github.com/expo/expo/pull/10801) by [@sjchmiela](https://github.com/sjchmiela))
- May have helped fix an issue where "initial notification response" (the one that opened the app) was not being delivered to Android apps. ([#10773](https://github.com/expo/expo/pull/10773) by [@sjchmiela](https://github.com/sjchmiela))

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

  > Note that the effect of this method is the same as if you called `Notifications.getPermissionsAsync()` (or `requestPermissionsAsync`) and then `Notifications.getDevicePushTokenAsync()`—it tries to both ask the user for user-facing notifications permissions and then tries to register the device for remote notifications. We are planning to deprecate the `.NOTIFICATIONS` permission soon.

## 0.2.0 — 2020-05-27

### 🛠 Breaking changes

- > Note that this may or may not be a breaking change for you — if you'd expect the notification to be automatically dismissed when tapped on this is a bug fix and a new feature (fixes inconsistency between platforms as on iOS this is the only supported behavior; adds the ability to customize the behavior on Android). If you'd expect the notification to only be dismissed at your will this is a breaking change and you'll need to add `autoDismiss: false` to your notification content inputs.
- Changed the default notification behavior on Android to be automatically dismissed when clicked. This is customizable with the `autoDismiss` parameter of `NotificationContentInput`. ([#8241](https://github.com/expo/expo/pull/8241) by [@thorbenprimke](https://github.com/thorbenprimke))

### 🎉 New features

- Added the ability to configure whether the notification should be automatically dismissed when tapped on or not (on Android) with the `autoDismiss` parameter of `NotificationContentInput`. ([#8241](https://github.com/expo/expo/pull/8241) by [@thorbenprimke](https://github.com/thorbenprimke))
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
