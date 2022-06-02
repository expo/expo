# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 5.0.0 — 2022-04-18

### ⚠️ Notices

- On Android bumped `com.google.firebase:firebase-core:17.2.1 ➡️ 20.1.2` and `com.google.firebase:firebase-common:19.0.0 ➡️ 20.1.0`. ([#17002](https://github.com/expo/expo/pull/17002) by [@bbarthec](https://github.com/bbarthec))
- On iOS bumped `Firebase/Core@7.7.0 ➡️ 8.14.0`. ([#17002](https://github.com/expo/expo/pull/17002) by [@bbarthec](https://github.com/bbarthec))
- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 4.1.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 4.1.0 — 2021-12-03

_This version does not introduce any user-facing changes._

## 4.0.3 — 2021-10-20

### 🐛 Bug fixes

- Fix crash on launch in iOS classic builds where `GoogleService-Info.plist` is not configured. ([#14811](https://github.com/expo/expo/pull/14811) by [@kudo](https://github.com/kudo))

## 4.0.2 — 2021-10-15

### 🎉 New features

- [iOS] Firebase native app will automatically be initialized without any extra native changes ([#14750](https://github.com/expo/expo/pull/14750) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- [plugin] Native regular expressions have been removed in favor Expo modules AppDelegate proxy ([#14750](https://github.com/expo/expo/pull/14750) by [@EvanBacon](https://github.com/EvanBacon))

## 4.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 4.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))
- Rename `IFirebaseOptions` type to `FirebaseOptions`. ([#14342](https://github.com/expo/expo/pull/14342) by [@Simek](https://github.com/Simek))

### 🎉 New features

- Update JS code to read manifest2 when manifest is not available. ([#13602](https://github.com/expo/expo/pull/13602) by [@wschurman](https://github.com/wschurman))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

## 3.1.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Removed unnecessary dependency on `unimodules-constants-interface`. ([#12876](https://github.com/expo/expo/pull/12876) by [@tsapeta](https://github.com/tsapeta))
- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 3.0.0 — 2021-03-10

### 📚 native library updates

- Updated native `firebase sdk version` from `6.14.0` to `7.7.0` on iOS. ([#12125](https://github.com/expo/expo/pull/12125) by [@bbarthec](https://github.com/bbarthec))

### 🎉 New features

- Converted plugin to TypeScript. ([#11715](https://github.com/expo/expo/pull/11715) by [@EvanBacon](https://github.com/EvanBacon))
- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

## 2.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Created config plugins ([#11538](https://github.com/expo/expo/pull/11538) by [@EvanBacon](https://github.com/EvanBacon))

## 1.3.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 1.2.0 — 2020-08-18

_This version does not introduce any user-facing changes._

## 1.1.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 1.1.0 — 2020-05-27

_This version does not introduce any user-facing changes._
