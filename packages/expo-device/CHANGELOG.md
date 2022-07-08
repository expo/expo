# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 4.3.0 — 2022-07-07

_This version does not introduce any user-facing changes._

## 4.2.0 — 2022-04-18

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 4.1.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 4.1.0 — 2021-12-03

### 🛠 Breaking changes

- Changed naming format of `modelName` to be more consistent ([#14670](https://github.com/expo/expo/pull/14670) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Added support for iOS 15.0 devices ([#14640](https://github.com/expo/expo/pull/14640) by [@EvanBacon](https://github.com/EvanBacon))
- Moved `modelName` implementation to native ([#14670](https://github.com/expo/expo/pull/14670) by [@EvanBacon](https://github.com/EvanBacon))

## 4.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 4.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Rewrite android code to Kotlin ([#13955](https://github.com/expo/expo/pull/13955) by [@kkafar](https://github.com/kkafar))
- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13757](https://github.com/expo/expo/pull/13757) by [@tsapeta](https://github.com/tsapeta))

## 3.3.0 — 2021-06-16

### 🎉 New features

- Added `totalMemory` to web. ([#12526](https://github.com/expo/expo/pull/12526) by [@EvanBacon](https://github.com/EvanBacon))
- Add device code mappings for newer iPhones and iPads. ([#12630](https://github.com/expo/expo/pull/12630) by [@ide](https://github.com/ide))
- Added missing mappings in `deviceYearClass` and `modelName`. ([#13261](https://github.com/expo/expo/pull/13261) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Removed unnecessary dependency on `unimodules-constants-interface`. ([#12876](https://github.com/expo/expo/pull/12876) by [@tsapeta](https://github.com/tsapeta))
- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 3.2.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

## 3.1.1 — 2021-01-15

_This version does not introduce any user-facing changes._

## 3.1.0 — 2021-01-15

_This version does not introduce any user-facing changes._

## 3.0.0 — 2020-12-23

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Removed `fbjs` dependency ([#11396](https://github.com/expo/expo/pull/11396) by [@cruzach](https://github.com/cruzach))
- Added support for detecting simulators running on Apple ARM64 processors. ([#11445](https://github.com/expo/expo/pull/11445) by [@sjchmiela](https://github.com/sjchmiela))

## 2.4.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 2.3.0 — 2020-08-18

### 🐛 Bug fixes

- Remove "request install packages" permission to make it opt-in. ([#8969](https://github.com/expo/expo/pull/8969) by [@bycedric](https://github.com/bycedric))

## 2.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 2.2.0 — 2020-05-27

_This version does not introduce any user-facing changes._
