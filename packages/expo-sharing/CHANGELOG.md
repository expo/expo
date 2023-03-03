# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 11.2.2 — 2023-03-03

_This version does not introduce any user-facing changes._

## 11.2.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 11.2.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 11.1.0 — 2022-12-30

### 🎉 New features

- Migrated Android implementation to Expo Modules API. ([#20112](https://github.com/expo/expo/pull/20112) by [@alanhughes](https://github.com/alanjhughes))

## 11.0.1 — 2022-10-27

### 🐛 Bug fixes

- On iOS, dismiss share sheet after sharing to an app is canceled, so the file doesn't fail to attach when trying to share again ([#19656](https://github.com/expo/expo/pull/19656) by [@keith-kurak](https://github.com/keith-kurak))
- Fixed `shareAsync` not resolving on Android. ([#21432](https://github.com/expo/expo/pull/21432) by [@alanhughes](https://github.com/alanjhughes))

## 11.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

## 10.3.0 — 2022-07-07

### 🛠 Breaking changes

- Changed the return type of the `shareAsync` function. The promise now resolves to `void` instead of an empty object. ([#18019](https://github.com/expo/expo/pull/18019) by [@barthap](https://github.com/barthap))

## 10.2.0 — 2022-04-18

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 10.1.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 10.1.0 — 2021-12-03

_This version does not introduce any user-facing changes._

## 10.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 10.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13757](https://github.com/expo/expo/pull/13757) by [@tsapeta](https://github.com/tsapeta))
- Rewrote Android part from Java to Kotlin ([#14010](https://github.com/expo/expo/pull/14010) by [@m1st4ke](https://github.com/m1st4ke))
- Migrated from `AsyncTask` to Kotlin coroutines. ([#14029](https://github.com/expo/expo/pull/14029) by [@m1st4ke](https://github.com/m1st4ke))

## 9.2.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Migrated from `unimodules-file-system-interface` to `expo-modules-core`.
- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 9.1.2 — 2021-04-13

_This version does not introduce any user-facing changes._

## 9.1.1 — 2021-04-01

_This version does not introduce any user-facing changes._

## 9.1.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

## 9.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 8.5.0 — 2020-11-17

### 🐛 Bug fixes

- Removed use of `org.unimodules.core.InvalidArgumentException` in favor of its coded version, `org.unimodules.core.errors.InvalidArgumentException`. ([#9961](https://github.com/expo/expo/pull/9961) by [@sjchmiela](https://github.com/sjchmiela))

## 8.4.0 — 2020-08-18

_This version does not introduce any user-facing changes._

## 8.3.0 — 2020-07-27

### 🐛 Bug fixes

- Fixed sharing external URIs on Android. ([#9223](https://github.com/expo/expo/pull/9223) by [@barthap](https://github.com/barthap))

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

_This version does not introduce any user-facing changes._
