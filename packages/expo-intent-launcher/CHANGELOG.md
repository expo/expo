# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 12.1.5 — 2025-06-06

_This version does not introduce any user-facing changes._

## 12.1.4 — 2025-04-30

_This version does not introduce any user-facing changes._

## 12.1.3 — 2025-04-25

_This version does not introduce any user-facing changes._

## 12.1.2 — 2025-04-14

_This version does not introduce any user-facing changes._

## 12.1.1 — 2025-04-09

_This version does not introduce any user-facing changes._

## 12.1.0 — 2025-04-04

### 🎉 New features

- Added a synchronous function `openApplication` to open an application by its package name. ([#25468](https://github.com/expo/expo/pull/25468) by [@reichhartd](https://github.com/reichhartd))
- Added an asynchronous function `getApplicationIconAsync` to retrieve the icon of an application by its package name. ([#25468](https://github.com/expo/expo/pull/25468) by [@reichhartd](https://github.com/reichhartd))

### 💡 Others

- [Android] Started using expo modules gradle plugin. ([#34176](https://github.com/expo/expo/pull/34176) by [@lukmccall](https://github.com/lukmccall))
- [apple] Migrate remaining `expo-module.config.json` to unified platform syntax. ([#34445](https://github.com/expo/expo/pull/34445) by [@reichhartd](https://github.com/reichhartd))

## 12.0.2 - 2025-01-10

_This version does not introduce any user-facing changes._

## 12.0.1 — 2024-10-22

_This version does not introduce any user-facing changes._

## 12.0.0 — 2024-10-22

_This version does not introduce any user-facing changes._

## 11.0.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 11.0.0 — 2024-04-18

### 🐛 Bug fixes

- On Android, intent number extras are converted to `double`. However, it must be `int`. ([#26164](https://github.com/expo/expo/pull/26164) by [@Alperengozum](https://github.com/Alperengozum))

### 💡 Others

- drop unused web `name` property. ([#27437](https://github.com/expo/expo/pull/27437) by [@EvanBacon](https://github.com/EvanBacon))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 10.11.0 — 2023-11-14

### 🛠 Breaking changes

- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

## 10.10.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

## 10.9.1 — 2023-09-18

### 🐛 Bug fixes

- Fixed errors in debug and crashes in production when an intent is launched without found activities. ([#24481](https://github.com/expo/expo/pull/24481) by [@robertying](https://github.com/robertying))

## 10.9.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

## 10.8.0 — 2023-08-02

_This version does not introduce any user-facing changes._

## 10.7.0 — 2023-06-21

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 10.6.0 — 2023-05-08

_This version does not introduce any user-facing changes._

## 10.5.2 — 2023-02-14

### 🐛 Bug fixes

- Fix attempting to import module on iOS. ([#21185](https://github.com/expo/expo/pull/21185) by [@alanjhughes](https://github.com/alanjhughes))

## 10.5.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 10.5.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 10.4.0 — 2022-12-30

### 🎉 New features

- Migrated to Expo Modules API. ([#20327](https://github.com/expo/expo/pull/20327) by [@alanhughes](https://github.com/alanjhughes))

## 10.3.1 — 2022-10-25

_This version does not introduce any user-facing changes._

## 10.3.0 — 2022-07-07

_This version does not introduce any user-facing changes._

## 10.2.0 — 2022-04-18

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 10.1.3 — 2022-02-14

### 🐛 Bug fixes

- Re-enable passing custom action string to `startActivityAsync`. ([#15671](https://github.com/expo/expo/pull/15671) by [@Simek](https://github.com/Simek))

## 10.1.2 — 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 10.1.0 — 2021-12-03

### 💡 Others

- Rewrite Android code to Kotlin. ([#14479](https://github.com/expo/expo/pull/14479) by [@kkafar](https://github.com/kkafar))

## 10.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 10.0.0 — 2021-09-28

### 🛠 Breaking changes

- Replace the stand-alone action constant strings with String Enum named `ActivityAction`. ([#14070](https://github.com/expo/expo/pull/14070) by [@Simek](https://github.com/Simek))

## 9.1.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 9.0.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))
- Upgrade native libraries. ([#12125](https://github.com/expo/expo/pull/12125) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Handle `ActivityNotFoundException` error to prevent crashes. ([#12078](https://github.com/expo/expo/pull/12078) by [@robertying](https://github.com/robertying))

## 8.4.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 8.3.0 — 2020-08-18

_This version does not introduce any user-facing changes._

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

_This version does not introduce any user-facing changes._
