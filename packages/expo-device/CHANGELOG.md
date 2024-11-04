# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 7.0.1 — 2024-10-22

_This version does not introduce any user-facing changes._

## 7.0.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS and tvOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- [iOS] Added some missing entries for 2024 Apple devices. ([#31970](https://github.com/expo/expo/pull/31970) by [@fobos531](https://github.com/fobos531))

## 6.0.2 — 2024-05-01

_This version does not introduce any user-facing changes._

## 6.0.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 6.0.0 — 2024-04-18

### 🐛 Bug fixes

- `Device.productName` now returns `Build.PRODUCT` instead of `Build.DEVICE`. ([#27230](https://github.com/expo/expo/pull/27230) by [@alex-fournier](https://github.com/alex-fournier))

### 💡 Others

- [iOS] Add privacy manifest describing required reason API usage. ([#27770](https://github.com/expo/expo/pull/27770) by [@aleqsio](https://github.com/aleqsio))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 5.9.3 - 2024-01-18

_This version does not introduce any user-facing changes._

## 5.9.2 - 2024-01-10

_This version does not introduce any user-facing changes._

## 5.9.1 - 2023-12-19

_This version does not introduce any user-facing changes._

## 5.9.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

## 5.8.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

### 🎉 New features

- Added new devices for iOS. ([#24555](https://github.com/expo/expo/pull/24555) by [@johanholm](https://github.com/johanholm))

### 🐛 Bug fixes

- [iOS] fix tvOS compilation. ([#24845](https://github.com/expo/expo/pull/24845) by [@douglowder](https://github.com/douglowder))

## 5.7.0 — 2023-09-15

### 🎉 New features

- Added support for Apple tvOS. ([#24329](https://github.com/expo/expo/pull/24329) by [@douglowder](https://github.com/douglowder))

## 5.6.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

## 5.5.0 — 2023-08-02

_This version does not introduce any user-facing changes._

## 5.4.0 — 2023-06-21

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 5.3.0 — 2023-05-08

### 🎉 New features

- Added `deviceType` constant. ([#21633](https://github.com/expo/expo/pull/21633) by [@robertherber](https://github.com/robertherber))
- On iOS added support for deviceType detection of Desktop on MacOS, checking for Catalyst and iPad app running on Mac. ([#21636](https://github.com/expo/expo/pull/21636) by [@robertherber](https://github.com/robertherber))

### 🐛 Bug fixes

- Fixed Device.getDeviceTypeAsync() returning TABLET on some devices. ([#21325](https://github.com/expo/expo/pull/21325) by [@behenate](https://github.com/behenate))

## 5.2.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 5.2.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 5.1.0 — 2022-12-30

### 🎉 New features

- Migrated Android codebase to use the new Expo modules API. ([#20118](https://github.com/expo/expo/pull/20118) by [@alanhughes](https://github.com/alanjhughes))
- Native module on iOS is now written in Swift using the Sweet API. ([#19526](https://github.com/expo/expo/pull/19526) by [@fobos531](https://github.com/fobos531))

## 5.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fixed `<bluetooth_name> is only readable to apps with targetSdkVersion lower than or equal to: 31` error when the `targetSdkVersion` is set to 33. ([#19666](https://github.com/expo/expo/pull/19666) by [@kudo](https://github.com/kudo), [@kudo](https://github.com/kudo))

### 💡 Others

- Refactored inline emulator checks to use enhanced checking in `EmulatorUtilities.isRunningOnEmulator() `. ([#16177](https://github.com/expo/expo/pull/16177)) by [@kbrandwijk](https://github.com/kbrandwijk), [@keith-kurak](https://github.com/keith-kurak))

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
