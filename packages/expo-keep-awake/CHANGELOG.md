# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 14.0.3 — 2025-02-19

_This version does not introduce any user-facing changes._

## 14.0.2 — 2025-01-10

_This version does not introduce any user-facing changes._

## 14.0.1 — 2024-10-22

_This version does not introduce any user-facing changes._

## 14.0.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS and tvOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Add missing `react` peer dependencies for isolated modules. ([#30470](https://github.com/expo/expo/pull/30470) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Use `EventSubscription` type instead of `Subscription`. ([#28946](https://github.com/expo/expo/pull/28946) by [@tsapeta](https://github.com/tsapeta))
- Replaced `@testing-library/react-hooks` with `@testing-library/react-native`. ([#30742](https://github.com/expo/expo/pull/30742) by [@byCedric](https://github.com/byCedric))

## 13.0.2 — 2024-05-15

### 🐛 Bug fixes

- Stop useKeepAwake calls deactivating each other by default. ([#28884](https://github.com/expo/expo/pull/28884) by [@macksal](https://github.com/macksal))

## 13.0.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 13.0.0 — 2024-04-18

### 💡 Others

- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 12.8.2 - 2024-01-18

_This version does not introduce any user-facing changes._

## 12.8.1 - 2024-01-10

### 🎉 New features

- Added support for macOS platform. ([#26221](https://github.com/expo/expo/pull/26221) by [@tsapeta](https://github.com/tsapeta))

## 12.8.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

## 12.7.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

## 12.6.0 — 2023-09-15

### 🎉 New features

- Added support for Apple tvOS. ([#24329](https://github.com/expo/expo/pull/24329) by [@douglowder](https://github.com/douglowder))

## 12.5.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

### 💡 Others

- On Android, migrate to Expo Modules Api. ([#24012](https://github.com/expo/expo/pull/24012) by [@alanjhughes](https://github.com/alanjhughes))

## 12.4.1 — 2023-08-02

_This version does not introduce any user-facing changes._

## 12.4.0 — 2023-07-28

_This version does not introduce any user-facing changes._

## 12.3.0 — 2023-06-21

_This version does not introduce any user-facing changes._

## 12.2.0 — 2023-06-13

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 12.1.0 — 2023-05-08

_This version does not introduce any user-facing changes._

## 12.0.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 12.0.0 — 2023-02-03

### 🛠 Breaking changes

- `KeepAwake.activateKeepAwake` has been deprecated in favor of `KeepAwake.activateKeepAwakeAsync`. ([#15826](https://github.com/expo/expo/pull/15826) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Added web support. ([#15826](https://github.com/expo/expo/pull/15826) by [@EvanBacon](https://github.com/EvanBacon))
- Added `KeepAwake.isAvailableAsync` which returns false on certain web browsers. ([#15826](https://github.com/expo/expo/pull/15826) by [@EvanBacon](https://github.com/EvanBacon))
- Added `KeepAwake.addListener` to observe state changes on web. ([#15826](https://github.com/expo/expo/pull/15826) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Define `KeepAwakeOptions` type, update the doc comments. ([#20489](https://github.com/expo/expo/pull/20489) by [@Simek](https://github.com/Simek))
- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 11.0.1 — 2022-10-28

_This version does not introduce any user-facing changes._

## 11.0.0 — 2022-10-06

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

## 10.2.1 — 2022-08-08

### 🐛 Bug fixes

- Attempt to fix `EXC_BAD_ACCESS` and `NSInvalidArgumentException` crashes by not referencing to the class instance function. ([#18553](https://github.com/expo/expo/pull/18553) by [@tsapeta](https://github.com/tsapeta))

## 10.2.0 — 2022-07-07

### 🐛 Bug fixes

- Fixed `Unable to deactivate keep awake. However, it probably is deactivated already` unhandled promise rejection warning when resuming apps on Android. ([#17319](https://github.com/expo/expo/pull/17319) by [@kudo](https://github.com/kudo))

### 💡 Others

- Migrated Expo modules definitions to the new naming convention. ([#17193](https://github.com/expo/expo/pull/17193) by [@tsapeta](https://github.com/tsapeta))

## 10.1.0 — 2022-04-18

### 🎉 New features

- Native module on iOS is now written in Swift using the new API. ([#15705](https://github.com/expo/expo/pull/15705) by [@tsapeta](https://github.com/tsapeta))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 10.0.2 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 10.0.1 — 2021-11-17

_This version does not introduce any user-facing changes._

## 10.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

## 9.3.0 — 2021-09-08

### 💡 Others

- Rewrite android code to Kotlin. ([#13996](https://github.com/expo/expo/pull/13996) by [@kkafar](https://github.com/kkafar))

## 9.2.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

## 9.1.2 — 2021-04-13

_This version does not introduce any user-facing changes._

## 9.1.1 — 2021-04-01

_This version does not introduce any user-facing changes._

## 9.1.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

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

### 🐛 Bug fixes

- Fixed `KeepAwake.activateKeepAwake` not working with multiple tags on Android. ([#7197](https://github.com/expo/expo/pull/7197) by [@lukmccall](https://github.com/lukmccall))
