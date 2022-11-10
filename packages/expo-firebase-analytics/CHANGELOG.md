# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 8.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

## 7.2.0 — 2022-09-15

### 💡 Others

- On Android bumped `com.google.firebase:firebase-core:20.1.2 ➡️ 21.1.0`, `com.google.firebase:firebase-common:20.1.0 ➡️ 20.1.1`, and `com.google.firebase:firebase-analytics:20.1.2 ➡️ 21.1.0` ([#18908](https://github.com/expo/expo/pull/18908) by [@keith-kurak](https://github.com/keith-kurak))
- On iOS bumped `Firebase/Core@8.14.0 ➡️ 9.5.0`. ([#18908](https://github.com/expo/expo/pull/18908) by [@keith-kurak](https://github.com/keith-kurak))

## 7.1.1 — 2022-07-16

_This version does not introduce any user-facing changes._

## 7.1.0 — 2022-07-07

_This version does not introduce any user-facing changes._

## 7.0.0 — 2022-04-18

### 🛠 Breaking changes

- Removed `setCurrentScreen` method that was previously deprecated. Use `logEvent` instead. ([#17002](https://github.com/expo/expo/pull/17002) by [@bbarthec](https://github.com/bbarthec))

### ⚠️ Notices

- On iOS bumped `Firebase/Core@7.7.0 ➡️ 8.14.0`. ([#17002](https://github.com/expo/expo/pull/17002) by [@bbarthec](https://github.com/bbarthec))
- On Android bumped `com.google.firebase:firebase-core:17.2.1 ➡️ 20.1.2`, `com.google.firebase:firebase-common:19.0.0 ➡️ 20.1.0` and `com.google.firebase:firebase-analytics:17.2.1 ➡️ 20.1.2`. ([#17002](https://github.com/expo/expo/pull/17002) by [@bbarthec](https://github.com/bbarthec))
- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 6.0.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 6.0.0 — 2021-12-03

### 🛠 Breaking changes

- Deprecates `setCurrentScreen` and removes the native API calls to support the latest Firebase SDKs. ([#4366](https://github.com/expo/expo/pull/4366) by [@IjzerenHein](https://github.com/IjzerenHein))

### 🎉 New features

- Add support for `setSessionTimeoutDuration` on iOS. ([#14364](https://github.com/expo/expo/pull/14364) by [@IjzerenHein](https://github.com/IjzerenHein))

## 5.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 5.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🎉 New features

- Add support for logging the `items` array to `logEvent` ([#14189](https://github.com/expo/expo/pull/14189) by [@IjzerenHein](https://github.com/IjzerenHein))
- Update JS code to read manifest2 when manifest is not available. ([#13602](https://github.com/expo/expo/pull/13602) by [@wschurman](https://github.com/wschurman))
- Update TS typings to allow null user property values. ([#14105](https://github.com/expo/expo/pull/14105) by [@kylerjensen](https://github.com/kylerjensen))

### 🐛 Bug fixes

- Fix `logEvent` exception on Android when using arrays. ([#14189](https://github.com/expo/expo/pull/14189) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))
- Using compat firebase libraries in version 9.0.2. ([#14400](https://github.com/expo/expo/pull/14400) by [@sebastianwilczek](https://github.com/sebastianwilczek))

## 4.1.0 — 2021-06-16

### 🎉 New features

- Add `setClientId` method to allow managing the clientId value in Expo Go. ([#12520](https://github.com/expo/expo/pull/12520) by [@esamelson](https://github.com/esamelson))

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 4.0.1 — 2021-03-30

### 🐛 Bug fixes

- Make expo-firebase-analytics work with firebase 8.x.x. ([#12297](https://github.com/expo/expo/pull/12297) by [@fson](https://github.com/fson))

## 4.0.0 — 2021-03-10

### 📚 native library updates

- Updated native `firebase sdk version` from `6.14.0` to `7.7.0` on iOS. ([#12125](https://github.com/expo/expo/pull/12125) by [@bbarthec](https://github.com/bbarthec))

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 3.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 2.6.0 — 2020-10-27

### 🐛 Bug fixes

- Fix exception in setCurrentScreen on Android. ([#10804](https://github.com/expo/expo/pull/10804) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix setup native firebase link in README. ([#10740](https://github.com/expo/expo/pull/10740) by [@jarvisluong](https://github.com/jarvisluong))

## 2.5.1 — 2020-10-08

- Fix failed network requests on Android. ([#10606](https://github.com/expo/expo/pull/10606) by [@IjzerenHein](https://github.com/IjzerenHein))

## 2.5.0 — 2020-08-18

_This version does not introduce any user-facing changes._

## 2.4.1 — 2020-05-29

### 🐛 Bug fixes

- Fixes `parseEvent` and `parseUserProperty` to allow numeric characters in the name parameter. ([#8516](https://github.com/expo/expo/pull/8516) by [@thorbenprimke](https://github.com/thorbenprimke))

## 2.4.0 — 2020-05-27

### 🎉 New features

- Add `setDebugModeEnabled` for enabling DebugView on the Expo client. ([#7796](https://github.com/expo/expo/pull/7796) by [@IjzerenHein](https://github.com/IjzerenHein))

### 🐛 Bug fixes

- Fix no events recorded on the Expo client when running on certain Android devices. ([#7679](https://github.com/expo/expo/pull/7679) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix `setAnalyticsCollectionEnabled` throwing an error.
- Fixes & improvements to the pure JS analytics client. ([#7796](https://github.com/expo/expo/pull/7796) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fixed logEvent in `expo-firebase-analytics` for Android. logEvent's optional properties parameter was causing a NPE on Android when not provided. ([#7897](https://github.com/expo/expo/pull/7897) by [@thorbenprimke](https://github.com/thorbenprimke))
