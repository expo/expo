# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 57.0.1 — 2026-07-15

_This version does not introduce any user-facing changes._

## 57.0.0 — 2026-06-25

_This version does not introduce any user-facing changes._

## 56.0.5 — 2026-06-05

### 🎉 New features

- [macOS] Add support for the macOS platform. ([#46535](https://github.com/expo/expo/pull/46535) by [@tsapeta](https://github.com/tsapeta))

## 56.0.4 — 2026-05-19

_This version does not introduce any user-facing changes._

## 56.0.3 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.2 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.1 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.0 — 2026-05-05

### 🛠 Breaking changes

- Bumped minimum iOS/tvOS version to 16.4, macOS to 13.4. ([#43296](https://github.com/expo/expo/pull/43296) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- [Android] Fixed network state listener emitting a stale "connected" event when the device disconnects from the network on Android 13+. ([#44656](https://github.com/expo/expo/pull/44656) by [@gueroverdenwshq](https://github.com/gueroverdenwshq))
- [Android] Make `isInternetReachable` much more robust. Also emit network state changes when network capabilities change. ([#45101](https://github.com/expo/expo/pull/45101) by [@LumaDevelopment](https://github.com/LumaDevelopment))

## 55.0.13 - 2026-04-09

_This version does not introduce any user-facing changes._

## 55.0.12 - 2026-04-07

_This version does not introduce any user-facing changes._

## 55.0.11 - 2026-04-02

_This version does not introduce any user-facing changes._

## 55.0.10 - 2026-04-02

_This version does not introduce any user-facing changes._

## 55.0.9 - 2026-03-17

_This version does not introduce any user-facing changes._

## 55.0.8 — 2026-02-25

_This version does not introduce any user-facing changes._

## 55.0.7 — 2026-02-20

_This version does not introduce any user-facing changes._

## 55.0.6 — 2026-02-16

_This version does not introduce any user-facing changes._

## 55.0.5 — 2026-02-08

_This version does not introduce any user-facing changes._

## 55.0.4 — 2026-02-03

_This version does not introduce any user-facing changes._

## 55.0.3 — 2026-01-27

_This version does not introduce any user-facing changes._

## 55.0.2 — 2026-01-26

_This version does not introduce any user-facing changes._

## 55.0.1 — 2026-01-22

_This version does not introduce any user-facing changes._

## 55.0.0 — 2026-01-21

### 🐛 Bug fixes

- [Android] Fix network state race condition by delaying callback ([#40705](https://github.com/expo/expo/pull/40705) by [@kosmydel](https://github.com/kosmydel))

## 8.0.8 - 2025-12-05

_This version does not introduce any user-facing changes._

## 8.0.7 — 2025-09-11

_This version does not introduce any user-facing changes._

## 8.0.6 — 2025-09-02

_This version does not introduce any user-facing changes._

## 8.0.5 — 2025-08-31

_This version does not introduce any user-facing changes._

## 8.0.4 — 2025-08-27

_This version does not introduce any user-facing changes._

## 8.0.3 — 2025-08-25

_This version does not introduce any user-facing changes._

## 8.0.2 — 2025-08-16

_This version does not introduce any user-facing changes._

## 8.0.1 — 2025-08-15

_This version does not introduce any user-facing changes._

## 8.0.0 — 2025-08-13

_This version does not introduce any user-facing changes._

## 7.1.5 — 2025-04-30

_This version does not introduce any user-facing changes._

## 7.1.4 — 2025-04-25

_This version does not introduce any user-facing changes._

## 7.1.3 — 2025-04-14

_This version does not introduce any user-facing changes._

## 7.1.2 — 2025-04-11

_This version does not introduce any user-facing changes._

## 7.1.1 — 2025-04-09

_This version does not introduce any user-facing changes._

## 7.1.0 — 2025-04-04

### 🐛 Bug fixes

- [Android] Added `netInfo` null check. ([#33559](https://github.com/expo/expo/pull/33559)) by [@pchalupa](https://github.com/pchalupa)

### 💡 Others

- [Android] Started using expo modules gradle plugin. ([#34176](https://github.com/expo/expo/pull/34176) by [@lukmccall](https://github.com/lukmccall))
- [apple] Migrate remaining `expo-module.config.json` to unified platform syntax. ([#34445](https://github.com/expo/expo/pull/34445) by [@reichhartd](https://github.com/reichhartd))
- [iOS] Fix warnings which will become errors in Swift 6. ([#35288](https://github.com/expo/expo/pull/35288) by [@behenate](https://github.com/behenate))

## 7.0.5 - 2025-01-10

_This version does not introduce any user-facing changes._

## 7.0.4 - 2024-12-16

### 🐛 Bug fixes

- On `Android`, Prevent crash from the `networkCallback` calling `fetchNetworkState`. ([#33563](https://github.com/expo/expo/pull/33563) by [@alanjhughes](https://github.com/alanjhughes))

## 7.0.3 - 2024-12-02

### 🐛 Bug fixes

- Fix event emitters not working on web. ([#33327](https://github.com/expo/expo/pull/33327) by [@aleqsio](https://github.com/aleqsio))

## 7.0.2 — 2024-11-22

_This version does not introduce any user-facing changes._

## 7.0.1 — 2024-11-22

### 🐛 Bug fixes

- [iOS] Added fix to getNetworkStateAsync failing on iOS ([#33137](https://github.com/expo/expo/pull/33137) by [@chrfalch](https://github.com/chrfalch))

## 7.0.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS and tvOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Add network state change listeners ([#28808](https://github.com/expo/expo/pull/28808) by [@reichhartd](https://github.com/reichhartd))

### 🐛 Bug fixes

- [Android] Fix `java.lang.IllegalArgumentException: NetworkCallback was not registered`. ([#30185](https://github.com/expo/expo/pull/30185) by [@lukmccall](https://github.com/lukmccall))
- [iOS] Fix wired ethernet connection being reported as unknown type. ([#30169](https://github.com/expo/expo/pull/30169) by [@Simek](https://github.com/Simek))
- [iOS] Fix getting IP address from wired ethernet connection interfaces. ([#31223](https://github.com/expo/expo/pull/31223) by [@matt-oakes](https://github.com/matt-oakes))
- Add missing `react` peer dependencies for isolated modules. ([#30477](https://github.com/expo/expo/pull/30477) by [@byCedric](https://github.com/byCedric))

## 6.0.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 6.0.0 — 2024-04-18

### 🎉 New features

- Add Apple TV support. ([#27819](https://github.com/expo/expo/pull/27819) by [@douglowder](https://github.com/douglowder))

### 💡 Others

- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 5.8.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

## 5.7.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

### 🎉 New features

- Add Node.js support. ([#24505](https://github.com/expo/expo/pull/24505) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Remove deprecated `getMacAddressAsync` method. ([#24505](https://github.com/expo/expo/pull/24505) by [@EvanBacon](https://github.com/EvanBacon))

## 5.6.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

## 5.5.0 — 2023-08-02

_This version does not introduce any user-facing changes._

## 5.4.0 — 2023-06-21

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 5.3.0 — 2023-05-08

_This version does not introduce any user-facing changes._

## 5.2.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 5.2.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 5.1.0 — 2022-12-30

### 🎉 New features

- Migrated to Expo Modules API. ([#20083](https://github.com/expo/expo/pull/20083) and [#20303](https://github.com/expo/expo/pull/20303) by [@alanhughes](https://github.com/alanjhughes))

## 5.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

## 4.3.0 — 2022-07-07

_This version does not introduce any user-facing changes._

## 4.2.0 — 2022-04-18

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 4.1.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 4.1.0 — 2021-12-03

_This version does not introduce any user-facing changes._

## 4.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 4.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13757](https://github.com/expo/expo/pull/13757) by [@tsapeta](https://github.com/tsapeta))
- Rewrite Android code to Kotlin. ([#14474](https://github.com/expo/expo/pull/14474) by [@kkafar](https://github.com/kkafar))

## 3.2.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 3.1.1 — 2021-03-30

_This version does not introduce any user-facing changes._

## 3.1.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 3.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fixed issue on Android where apps would crash when calling `getIpAddressAsync` when using cellular data or on certain IP addresses.

## 2.4.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 2.3.0 — 2020-08-18

_This version does not introduce any user-facing changes._

## 2.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 2.2.0 — 2020-05-27

_This version does not introduce any user-facing changes._
