# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 55.0.9 — 2026-03-17

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

### 💡 Others

- [Android] Fix missing `await` for `performHapticsAsync` ([#40987](https://github.com/expo/expo/pull/40987) by [@kamui545](https://github.com/kamui545))
- [Android] Removed unused `androidx.annotation:annotation` dependency. ([#39759](https://github.com/expo/expo/pull/39759) by [@lukmccall](https://github.com/lukmccall))

## 15.0.8 - 2025-12-05

_This version does not introduce any user-facing changes._

## 15.0.7 — 2025-09-11

_This version does not introduce any user-facing changes._

## 15.0.6 — 2025-09-02

_This version does not introduce any user-facing changes._

## 15.0.5 — 2025-08-31

_This version does not introduce any user-facing changes._

## 15.0.4 — 2025-08-27

_This version does not introduce any user-facing changes._

## 15.0.3 — 2025-08-25

_This version does not introduce any user-facing changes._

## 15.0.2 — 2025-08-16

_This version does not introduce any user-facing changes._

## 15.0.1 — 2025-08-15

_This version does not introduce any user-facing changes._

## 15.0.0 — 2025-08-13

_This version does not introduce any user-facing changes._

## 14.1.4 — 2025-04-30

_This version does not introduce any user-facing changes._

## 14.1.3 — 2025-04-25

_This version does not introduce any user-facing changes._

## 14.1.2 — 2025-04-14

_This version does not introduce any user-facing changes._

## 14.1.1 — 2025-04-09

_This version does not introduce any user-facing changes._

## 14.1.0 — 2025-04-04

### 🎉 New features

- [Android] Added new method `performAndroidHapticsAsync()`. The `Vibrator` api is no longer recommended. This method avoids it. ([#34077](https://github.com/expo/expo/pull/34077) by [@alanjhughes](https://github.com/alanjhughes))
- [Web] Add web support using Web Vibration API. ([#34131](https://github.com/expo/expo/pull/34131) by [@reichhartd](https://github.com/reichhartd))

### 💡 Others

- [Android] Started using expo modules gradle plugin. ([#34176](https://github.com/expo/expo/pull/34176) by [@lukmccall](https://github.com/lukmccall))
- [apple] Migrate remaining `expo-module.config.json` to unified platform syntax. ([#34445](https://github.com/expo/expo/pull/34445) by [@reichhartd](https://github.com/reichhartd))

## 14.0.1 - 2025-01-10

_This version does not introduce any user-facing changes._

## 14.0.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Jump directly to source. ([#29244](https://github.com/expo/expo/pull/29244) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Align web implementation exports as native to support DOM components when using `@expo/dom-webview`. ([#31662](https://github.com/expo/expo/pull/31662) by [@kudo](https://github.com/kudo))
- Fixed bundling error on Web. ([#32183](https://github.com/expo/expo/pull/32183) by [@kudo](https://github.com/kudo))

## 13.0.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 13.0.0 — 2024-04-18

### 🎉 New features

- Introduce `rigid` and `soft` impact types ([#28169](https://github.com/expo/expo/pull/28169) by [@rodperottoni](https://github.com/rodperottoni))

### 💡 Others

- drop unused web `name` property. ([#27437](https://github.com/expo/expo/pull/27437) by [@EvanBacon](https://github.com/EvanBacon))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 12.8.1 - 2023-12-19

_This version does not introduce any user-facing changes._

## 12.8.0 — 2023-11-14

- Improve Android vibration amplitudes and durations. ([#25101](https://github.com/expo/expo/pull/25101) by [@alexandrius](https://github.com/alexandrius))

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

## 12.7.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

## 12.6.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

## 12.5.0 — 2023-08-02

_This version does not introduce any user-facing changes._

## 12.4.0 — 2023-06-21

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 12.3.0 — 2023-05-08

_This version does not introduce any user-facing changes._

## 12.2.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 12.2.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 12.1.0 — 2022-12-30

### 🎉 New features

- Migrated Android codebase to use the new Expo modules API. ([#20016](https://github.com/expo/expo/pull/20016) by [@alanhughes](https://github.com/alanjhughes))

## 12.0.1 — 2022-11-03

### 🐛 Bug fixes

- Fixed rare crash on iOS when using Feedback Generator's API not on the main thread. ([#19819](https://github.com/expo/expo/pull/19819) by [@AntonGolikov](https://github.com/AntonGolikov))

## 12.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

## 11.3.0 — 2022-07-07

### 💡 Others

- Migrated Expo modules definitions to the new naming convention. ([#17193](https://github.com/expo/expo/pull/17193) by [@tsapeta](https://github.com/tsapeta))

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
