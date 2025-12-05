# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 14.0.8 — 2025-12-05

_This version does not introduce any user-facing changes._

## 14.0.7 — 2025-09-11

_This version does not introduce any user-facing changes._

## 14.0.6 — 2025-09-02

_This version does not introduce any user-facing changes._

## 14.0.5 — 2025-08-31

_This version does not introduce any user-facing changes._

## 14.0.4 — 2025-08-27

_This version does not introduce any user-facing changes._

## 14.0.3 — 2025-08-25

_This version does not introduce any user-facing changes._

## 14.0.2 — 2025-08-16

_This version does not introduce any user-facing changes._

## 14.0.1 — 2025-08-15

_This version does not introduce any user-facing changes._

## 14.0.0 — 2025-08-13

_This version does not introduce any user-facing changes._

## 13.1.4 — 2025-04-30

_This version does not introduce any user-facing changes._

## 13.1.3 — 2025-04-25

_This version does not introduce any user-facing changes._

## 13.1.2 — 2025-04-14

_This version does not introduce any user-facing changes._

## 13.1.1 — 2025-04-09

_This version does not introduce any user-facing changes._

## 13.1.0 — 2025-04-04

### 💡 Others

- [Android] Started using expo modules gradle plugin. ([#34176](https://github.com/expo/expo/pull/34176) by [@lukmccall](https://github.com/lukmccall))
- [apple] Migrate remaining `expo-module.config.json` to unified platform syntax. ([#34445](https://github.com/expo/expo/pull/34445) by [@reichhartd](https://github.com/reichhartd))
- [iOS] Fix warnings which will become errors in Swift 6. ([#35288](https://github.com/expo/expo/pull/35288) by [@behenate](https://github.com/behenate))

## 13.0.1 - 2025-01-10

_This version does not introduce any user-facing changes._

## 13.0.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- Removed all `NativeModulesProxy` occurrences. ([#31496](https://github.com/expo/expo/pull/31496) by [@reichhartd](https://github.com/reichhartd))

## 12.0.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 12.0.0 — 2024-04-18

### 🛠 Breaking changes

- [web] `sendSMSAsync` now throws error code `ERR_UNAVAILABLE` instead of `E_SMS_UNAVAILABLE`. ([#27437](https://github.com/expo/expo/pull/27437) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- drop unused web `name` property. ([#27437](https://github.com/expo/expo/pull/27437) by [@EvanBacon](https://github.com/EvanBacon))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 11.7.1 - 2023-12-19

_This version does not introduce any user-facing changes._

## 11.7.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

## 11.6.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

## 11.5.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

## 11.4.0 — 2023-06-21

### 📚 3rd party library updates

- Updated `robolectric` to `4.10` and `junit` to `4.13.2`. ([#22395](https://github.com/expo/expo/pull/22395) by [@josephyanks](https://github.com/josephyanks))

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 11.3.0 — 2023-05-08

_This version does not introduce any user-facing changes._

## 11.2.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 11.2.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 11.1.0 — 2022-12-30

### 🎉 New features

- Migrated to Expo Modules API. ([#19996](https://github.com/expo/expo/pull/19996) and ([#19967](https://github.com/expo/expo/pull/19967) by [@alanhughes](https://github.com/alanjhughes))

## 11.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

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

- Added `AndroidManifest.xml` queries for intent handling. ([#13388](https://github.com/expo/expo/pull/13388) by [@EvanBacon](https://github.com/EvanBacon))
- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fixed duplicate recipients & message bodies ([#13651](https://github.com/expo/expo/pull/13651) by [@kkafar](https://github.com/kkafar))
- Fixed Android intent XML parsing issues. ([#13401](https://github.com/expo/expo/pull/13401) by [@quicksnap](https://github.com/quicksnap))
- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Added unit tests ([#13674](https://github.com/expo/expo/pull/13674) by [@kkafar](https://github.com/kkafar))
- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13757](https://github.com/expo/expo/pull/13757) by [@tsapeta](https://github.com/tsapeta))

## 9.2.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Handle null/undefined recipients in sendSMSAsync ([#13673](https://github.com/expo/expo/pull/13673) by [@kkafar](https://github.com/kkafar))
- Converted Android code to Kotlin ([#13505](https://github.com/expo/expo/pull/13505) by [@kkafar](https://github.com/kkafar))
- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))
- Removed unnecessary dependency on `unimodules-permissions-interface`. ([#12961](https://github.com/expo/expo/pull/12961) by [@tsapeta](https://github.com/tsapeta))
- Export missing types used by the API: `SMSAttachment` and `SMSOptions`. ([#13240](https://github.com/expo/expo/pull/13240) by [@Simek](https://github.com/Simek))

## 9.1.2 — 2021-04-13

_This version does not introduce any user-facing changes._

## 9.1.1 — 2021-03-31

_This version does not introduce any user-facing changes._

## 9.1.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

## 9.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 8.4.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 8.3.0 — 2020-08-11

### 🐛 Bug fixes

- Fixed rare crashes on iOS caused by `MFMessageComposeViewController` being initialized not from the main thread. ([#8575](https://github.com/expo/expo/pull/8575) by [@tsapeta](https://github.com/tsapeta))

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

### 🎉 New features

- Add `attachments` as an optional parameter to `sendSMSAsync`. It can be used to provide an attachment along with the recipients and message arguments. ([#7967](https://github.com/expo/expo/pull/7967) by [@thorbenprimke](https://github.com/thorbenprimke))
