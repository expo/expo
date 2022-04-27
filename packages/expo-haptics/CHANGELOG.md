# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 11.2.0 — 2022-04-18

### 🎉 New features

- Use JSI host object instead of the bridge module for communication between JavaScript and native code. ([#16972](https://github.com/expo/expo/pull/16972) by [@tsapeta](https://github.com/tsapeta))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 11.1.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 11.1.0 — 2021-12-03

### 💡 Others

- Removed legacy Objective-C implementation and changed the pod name to `ExpoHaptics`. ([#15083](https://github.com/expo/expo/pull/15083) by [@tsapeta](https://github.com/tsapeta))
- Simplified iOS implementation with enums as argument types. ([#15129](https://github.com/expo/expo/pull/15129) by [@tsapeta](https://github.com/tsapeta))

## 11.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 11.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

## 10.2.0-alpha.0 — 2021-08-17

### 💡 Others

- Migrated from `@unimodules/core` to `expo-modules-core`. (by [@tsapeta](https://github.com/tsapeta))
- Experimental Swift implementation using Sweet API. (by [@tsapeta](https://github.com/tsapeta))
- Rewrote from Java to Kotlin. ([#13611](https://github.com/expo/expo/pull/13611) by [@M1ST4KE](https://github.com/m1st4ke))

## 10.1.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 10.0.0 — 2021-03-10

### 🛠 Breaking changes

- Dropped deprecated `notification`, `impact`, `selection` methods. ([#11907](https://github.com/expo/expo/pull/11907) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

## 9.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 8.4.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 8.3.0 — 2020-08-18

_This version does not introduce any user-facing changes._

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

_This version does not introduce any user-facing changes._
