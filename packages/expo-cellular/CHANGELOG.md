# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 7.0.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- Update cellular generation comments to specify HSPAP as 3G instead of 4G. ([#30008](https://github.com/expo/expo/pull/30008) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 6.0.3 - 2024-06-27

### 🐛 Bug fixes

- [Android] Fix support for 5G ([#30012](https://github.com/expo/expo/pull/30012) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 6.0.2 — 2024-05-01

_This version does not introduce any user-facing changes._

## 6.0.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 6.0.0 — 2024-04-18

### 💡 Others

- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 5.7.1 - 2023-12-19

_This version does not introduce any user-facing changes._

## 5.7.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

## 5.6.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

## 5.5.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

## 5.4.1 — 2023-08-02

_This version does not introduce any user-facing changes._

## 5.4.0 — 2023-07-28

_This version does not introduce any user-facing changes._

## 5.3.0 — 2023-06-21

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 5.2.0 — 2023-05-08

_This version does not introduce any user-facing changes._

## 5.1.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 5.1.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 5.0.1 — 2022-10-28

_This version does not introduce any user-facing changes._

## 5.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Added missing permissions requester. ([#19633](https://github.com/expo/expo/pull/19633) by [@lukmccall](https://github.com/lukmccall))

### 💡 Others

- [plugin] Migrate import from @expo/config-plugins to expo/config-plugins and @expo/config-types to expo/config. ([#18855](https://github.com/expo/expo/pull/18855) by [@brentvatne](https://github.com/brentvatne))

## 4.3.0 — 2022-07-07

### 💡 Others

- Migrated Expo modules definitions to the new naming convention. ([#17193](https://github.com/expo/expo/pull/17193) by [@tsapeta](https://github.com/tsapeta))

## 4.2.0 — 2022-04-18

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 4.1.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 4.1.0 — 2021-12-03

### 💡 Others

- Removed legacy Objective-C implementation and changed the pod name to `ExpoCellular`. ([#15082](https://github.com/expo/expo/pull/15082) by [@tsapeta](https://github.com/tsapeta))

## 4.0.0 — 2021-09-28

### 🛠 Breaking changes

- Deprecated module's constants in favor of new methods returning up-to-date data. ([#13729](https://github.com/expo/expo/pull/13729) by [@m1st4ke](https://github.com/m1st4ke))
- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🎉 New features

- Added 5G cellular support ([#13713](https://github.com/expo/expo/pull/13713) by [@m1st4ke](https://github.com/m1st4ke))
- Added methods returning up-to-date data. ([#13729](https://github.com/expo/expo/pull/13729) by [@m1st4ke](https://github.com/m1st4ke))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Added experimental opt-in implementation in Swift ([#13523](https://github.com/expo/expo/pull/13523) by [@tsapeta](https://github.com/tsapeta))
- Rewrote Android part from Java to Kotlin ([#13694](https://github.com/expo/expo/pull/13694) by [@m1st4ke](https://github.com/m1st4ke))

## 3.2.0 — 2021-06-16

### 🎉 New features

- [plugin] Created config plugin for applying permissions on Android ([#13175](https://github.com/expo/expo/pull/13175) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fix null cellular information on iOS. ([#12710](https://github.com/expo/expo/pull/12710) by [@randomhajile](https://github.com/randomhajile))
- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))
- Add TypeScript types to the exported constants: `allowsVoip`, `carrier`, `isoCountryCode`, `mobileCountryCode` and `mobileNetworkCode`. ([#12838](https://github.com/expo/expo/pull/12838) by [@simek](https://github.com/simek))

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 3.1.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 3.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 2.4.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 2.3.0 — 2020-08-18

_This version does not introduce any user-facing changes._

## 2.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 2.2.0 — 2020-05-27

_This version does not introduce any user-facing changes._
