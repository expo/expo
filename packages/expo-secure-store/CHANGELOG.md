# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 12.8.1 — 2023-12-19

_This version does not introduce any user-facing changes._

## 12.8.0 — 2023-12-12

### 🎉 New features

- [iOS] Added possibility to store values that require authentication and ones that don't under the same `keychainService`. ([#23841](https://github.com/expo/expo/pull/23841) by [@behenate](https://github.com/behenate))
- [iOS] Added synchronous functions for storing and retrieving values from the store. ([#23841](https://github.com/expo/expo/pull/23841) by [@behenate](https://github.com/behenate))

## 12.7.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

### 💡 Others

- [Android] Enforce minimum authentication tag length for the `AESEncryptor` for improved security. ([#25294](https://github.com/expo/expo/pull/25294) by [@behenate](https://github.com/behenate))

## 12.6.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

### 🐛 Bug fixes

- Fixed the 'WHEN_UNLOCKED_THIS_DEVICE_ONLY' constraint being incorrectly mapped to wrong secure store accessible ([#24831](https://github.com/expo/expo/pull/24831) by [@mmmguitar](https://github.com/mmmguitar))

## 12.5.0 — 2023-09-04

### 🎉 New features

- [Android] Migrated to Expo Modules API. ([#23804](https://github.com/expo/expo/pull/23804) by [@behenate](https://github.com/behenate))
- [Android] It is now possible to store values that require authentication and ones that don't under the same `keychainService`. ([#23804](https://github.com/expo/expo/pull/23804) by [@behenate](https://github.com/behenate))
- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

## 12.4.1 — 2023-08-02

_This version does not introduce any user-facing changes._

## 12.4.0 — 2023-07-28

### 🎉 New features

- Added a config plugin to automatically set NSFaceIDUsageDescription on iOS. ([#23268](https://github.com/expo/expo/pull/23268) by [@aleqsio](https://github.com/aleqsio))

## 12.3.1 - 2023-07-04

### 💡 Others

- Added a check for the `NSFaceIDUsageDescription` key in the `set` function. ([#23275](https://github.com/expo/expo/pull/23275) by [@alanjhughes](https://github.com/alanjhughes))

## 12.3.0 — 2023-06-13

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

### 💡 Others

- Added automatic invalidated key handling on Android. ([#22716](https://github.com/expo/expo/pull/22716) by [@behenate](https://github.com/behenate))

## 12.2.0 — 2023-05-08

### 🎉 New features

- Migrated iOS codebase to use Expo modules API. ([#21393](https://github.com/expo/expo/pull/21393) by [@alanjhughes](https://github.com/alanjhughes))

## 12.1.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 12.1.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 12.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fixed missing `code` and `message` in promise errors. ([#19555](https://github.com/expo/expo/pull/19555) by [@tsapeta](https://github.com/tsapeta))

### ⚠️ Notices

- Changed `requireAuthentication` option to also require biometrics on iOS (matches Android behavior) ([#18591](https://github.com/expo/expo/pull/18591) by [@stefan-schweiger](https://github.com/stefan-schweiger))

## 11.3.0 — 2022-07-07

_This version does not introduce any user-facing changes._

## 11.2.0 — 2022-04-18

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 11.1.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 11.1.0 — 2021-12-03

_This version does not introduce any user-facing changes._

## 11.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 11.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13757](https://github.com/expo/expo/pull/13757) by [@tsapeta](https://github.com/tsapeta))

## 10.2.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 10.1.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Data saved with `expo-secure-store` is no longer lost upon ejecting, **if you first upgrade your app to SDK 41 before ejecting**. ([#11309](https://github.com/expo/expo/pull/11309) by [@cruzach](https://github.com/cruzach))
  > On Android, all of your `SecureStore` data will be migrated on app start-up. On iOS, keys and their associated data will be migrated whenever you call `getItemAsync` on that key. This means that any keys you don't `get` while on SDK 41 will **not** be migrated.

## 10.0.0 — 2021-01-15

### 🛠 Breaking changes- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 9.3.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 9.2.0 — 2020-08-11

### 🎉 New features

- Create `isAvailableAsync` method. ([#9668](https://github.com/expo/expo/pull/9668) by [@EvanBacon](https://github.com/EvanBacon))

## 9.1.0 — 2020-07-27

### 🐛 Bug fixes

- Fix incorrect security attribute applied when using the flag WHEN_UNLOCKED_THIS_DEVICE_ONLY on iOS ([#9264](https://github.com/expo/expo/pull/9264) by [@cjthompson](https://github.com/cjthompson))

## 9.0.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 9.0.0 — 2020-05-27

### 🛠 Breaking changes

- The base64 output will no longer contain newline and special character (`\n`, `\r`) on Android. ([#7841](https://github.com/expo/expo/pull/7841) by [@jarvisluong](https://github.com/jarvisluong))
