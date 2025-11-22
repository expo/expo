# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

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

## 14.1.5 - 2025-06-06

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

### 🛠 Breaking changes

- Bump minimum macOS version to 11.0. ([#34980](https://github.com/expo/expo/pull/34980) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 💡 Others

- [Android] Started using expo modules gradle plugin. ([#34176](https://github.com/expo/expo/pull/34176) by [@lukmccall](https://github.com/lukmccall))
- [iOS] Fix warnings which will become errors in Swift 6. ([#35288](https://github.com/expo/expo/pull/35288) by [@behenate](https://github.com/behenate))

## 14.0.2 - 2025-01-10

_This version does not introduce any user-facing changes._

## 14.0.1 — 2024-10-22

_This version does not introduce any user-facing changes._

## 14.0.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS and tvOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

## 13.0.2 — 2024-04-24

### 💡 Others

- Update mocks for SDK51. ([#28424](https://github.com/expo/expo/pull/28424) by [@aleqsio](https://github.com/aleqsio))

## 13.0.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 13.0.0 — 2024-04-18

### 🎉 New features

- Add Apple TV support. ([#27819](https://github.com/expo/expo/pull/27819) by [@douglowder](https://github.com/douglowder))

### 💡 Others

- drop unused web `name` property. ([#27437](https://github.com/expo/expo/pull/27437) by [@EvanBacon](https://github.com/EvanBacon))
- Update error message to reflect that web crypto works on web with a localhost hostname and often doesn't require `https`. ([#26729](https://github.com/expo/expo/pull/26729) by [@EvanBacon](https://github.com/EvanBacon))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 12.8.1 - 2024-02-16

### 🎉 New features

- Added support for macOS platform. ([#26831](https://github.com/expo/expo/pull/26831) by [@tsapeta](https://github.com/tsapeta))

## 12.8.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

## 12.7.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

### 💡 Others

- Change getRandomBytesAsync to use native getRandomValues when available. ([#24716](https://github.com/expo/expo/pull/24716) by [@aleqsio](https://github.com/aleqsio))

## 12.6.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

## 12.5.1 — 2023-08-02

_This version does not introduce any user-facing changes._

## 12.5.0 — 2023-07-28

_This version does not introduce any user-facing changes._

## 12.4.0 — 2023-06-13

### 📚 3rd party library updates

- Updated `robolectric` to `4.10` and `junit` to `4.13.2`. ([#22395](https://github.com/expo/expo/pull/22395) by [@josephyanks](https://github.com/josephyanks))

### 🐛 Bug fixes

- Return lower case UUID on iOS. ([#22509](https://github.com/expo/expo/pull/22509) by [@LinusU](https://github.com/LinusU))
- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 12.3.0 — 2023-05-08

_This version does not introduce any user-facing changes._

## 12.2.2 — 2023-04-06

### 💡 Others

- Set the missing return type of `randomUUID` method. ([#21187](https://github.com/expo/expo/pull/21187) by [@KiwiKilian](https://github.com/KiwiKilian))

## 12.2.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 12.2.0 — 2023-02-03

### 🎉 New features

- Added a `digest` method to get a cryptographic digest of a typed array. ([#20886](https://github.com/expo/expo/pull/20886) by [@aleqsio](https://github.com/aleqsio))

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 12.1.0 — 2022-12-30

### 🎉 New features

- Added a `randomUUID` method to get a random UUIDv4 string. ([#20274](https://github.com/expo/expo/pull/20274) by [@aleqsio](https://github.com/aleqsio))
- Added a `getRandomValues` method to fill typed arrays. ([#20257](https://github.com/expo/expo/pull/20257) by [@aleqsio](https://github.com/aleqsio))
- Ported over `getRandomBytes`, `getRandomBytesAsync` methods from `expo-random`. ([#20217](https://github.com/expo/expo/pull/20217) by [@aleqsio](https://github.com/aleqsio))

## 12.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

## 11.0.0 — 2022-07-07

### 🎉 New features

- The module on Android now uses JSI host object instead of the bridge module for communication between JavaScript and native code. ([#17614](https://github.com/expo/expo/pull/17614) by [@lukmccall](https://github.com/lukmccall))

### 💡 Others

- Migrated Expo modules definitions to the new naming convention. ([#17193](https://github.com/expo/expo/pull/17193) by [@tsapeta](https://github.com/tsapeta))

## 10.2.0 — 2022-04-18

### 🎉 New features

- Native module on iOS is now written in Swift using the new API. ([#16129](https://github.com/expo/expo/pull/16129) by [@tsapeta](https://github.com/tsapeta))
- Use JSI host object instead of the bridge module for communication between JavaScript and native code. ([#16972](https://github.com/expo/expo/pull/16972) by [@tsapeta](https://github.com/tsapeta))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 10.1.2 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 10.1.1 — 2021-12-08

_This version does not introduce any user-facing changes._

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

- Rewrite Android code to Kotlin. ([#14425](https://github.com/expo/expo/pull/14425) by [@kkafar](https://github.com/kkafar))
- Add tests. ([#13592](https://github.com/expo/expo/pull/13592) by [@mstach60161](https://github.com/mstach60161))
- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13757](https://github.com/expo/expo/pull/13757) by [@tsapeta](https://github.com/tsapeta))

## 9.2.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 9.1.0 — 2021-03-10

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
