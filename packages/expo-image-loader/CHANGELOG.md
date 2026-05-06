# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 56.0.0 — 2026-05-05

_This version does not introduce any user-facing changes._

## 55.0.0 — 2026-01-21

### 🛠 Breaking changes

- iOS implementation has been moved to `expo-modules-core`. ([#41395](https://github.com/expo/expo/pull/41395) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- [Android] Removed references to legacy native modules API. ([#41858](https://github.com/expo/expo/pull/41858) by [@lukmccall](https://github.com/lukmccall))

## 6.0.0 — 2025-08-13

### 🎉 New features

- [iOS] Add Apple TV support. ([#38513](https://github.com/expo/expo/pull/38513) by [@douglowder](https://github.com/douglowder))

## 5.1.0 — 2025-04-04

### 💡 Others

- [Android] Started using expo modules gradle plugin. ([#34176](https://github.com/expo/expo/pull/34176) by [@lukmccall](https://github.com/lukmccall))
- [apple] Migrate remaining `expo-module.config.json` to unified platform syntax. ([#34445](https://github.com/expo/expo/pull/34445) by [@reichhartd](https://github.com/reichhartd))

## 5.0.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

## 4.7.0 — 2024-04-18

### 💡 Others

- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 4.6.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

### 💡 Others

- Renamed `unimodule.json` to `expo-module.config.json`. ([#25100](https://github.com/expo/expo/pull/25100) by [@reichhartd](https://github.com/reichhartd))

## 4.5.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

## 4.4.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Bump `Glide` version to resolve `SecurityException` on Android 13. ([#24196](https://github.com/expo/expo/pull/24196) by [@alanjhughes](https://github.com/alanjhughes))

## 4.3.0 — 2023-06-13

- Removed `com.facebook.fresco:fresco` dependency ([#22542](https://github.com/expo/expo/pull/22542) by [@josephyanks](https://github.com/josephyanks))

### 📚 3rd party library updates

- Updated `com.github.bumptech.glide:glide` to `4.13.2` and added customizable `glideVersion` variable on ext. ([#22542](https://github.com/expo/expo/pull/22542) by [@josephyanks](https://github.com/josephyanks))

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 4.2.0 — 2023-05-08

_This version does not introduce any user-facing changes._

## 4.1.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 4.1.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 4.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

## 3.2.0 — 2022-04-18

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 3.1.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 3.1.0 — 2021-12-03

_This version does not introduce any user-facing changes._

## 3.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

## 2.3.0-alpha.0 — 2021-08-17

_This version does not introduce any user-facing changes._

## 2.2.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

## 2.1.1 — 2021-03-23

_This version does not introduce any user-facing changes._

## 2.1.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 2.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 1.3.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 1.2.0 — 2020-08-18

_This version does not introduce any user-facing changes._

## 1.1.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 1.1.0 — 2020-05-27

_This version does not introduce any user-facing changes._
