# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 13.0.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 13.0.0 — 2024-04-18

### 💡 Others

- Prevent config plugin from writing permissions until prebuild. ([#28107](https://github.com/expo/expo/pull/28107) by [@EvanBacon](https://github.com/EvanBacon))
- drop unused web `name` property. ([#27437](https://github.com/expo/expo/pull/27437) by [@EvanBacon](https://github.com/EvanBacon))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 12.9.3 - 2024-02-16

### 🎉 New features

- `BarCodeScannerResult` now returns an additional `raw` field corresponding to the barcode value as it was encoded in the barcode without parsing. Will always be undefined on iOS. ([#25391](https://github.com/expo/expo/pull/25391) by [@ajacquierbret](https://github.com/ajacquierbret))

## 12.9.2 - 2023-12-21

### 💡 Others

- Add FYI link. ([#26049](https://github.com/expo/expo/pull/26049) by [@alanjhughes](https://github.com/alanjhughes))

## 12.9.1 - 2023-12-19

### 🛠 Breaking changes

- `expo-barcode-scanner` is now deprecated. Please use `expo-camera` instead. ([#26025](https://github.com/expo/expo/pull/26025) by [@alanjhughes](https://github.com/alanjhughes))

## 12.9.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

## 12.8.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

### 🐛 Bug fixes

- On `Android`, use `rawValue` in the case of scanning a contact card to return complete information. ([#24791](https://github.com/expo/expo/pull/24791) by [@alanhughes](https://github.com/alanjhughes))
- On `iOS`, correctly handle when unsupported barcode types are passed to the `barCodeTypes` prop. ([#24784](https://github.com/expo/expo/pull/24784) by [@alanhughes](https://github.com/alanjhughes))

### 💡 Others

- Ship untranspiled JSX to support custom handling of `jsx` and `createElement`. ([#24889](https://github.com/expo/expo/pull/24889) by [@EvanBacon](https://github.com/EvanBacon))

## 12.7.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

## 12.6.1 — 2023-08-02

_This version does not introduce any user-facing changes._

## 12.6.0 — 2023-07-28

_This version does not introduce any user-facing changes._

## 12.5.3 - 2023-06-30

### 💡 Others

- Update snapshots. ([#23238](https://github.com/expo/expo/pull/23238) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 12.5.2 — 2023-06-28

_This version does not introduce any user-facing changes._

## 12.5.1 — 2023-06-27

### 🐛 Bug fixes

- On Android, fixed an issue where certain text characters would not be recognised. ([#23094](https://github.com/expo/expo/pull/23094) by [@alanhughes](https://github.com/alanjhughes))

## 12.5.0 — 2023-06-13

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

### 💡 Others

- [Android] Replace dependency on deprecated `com.google.android.gms:play-services-vision` with `com.google.mlkit:barcode-scanning`. ([#22107](https://github.com/expo/expo/pull/22107) by [@toshiyuki-suzuki-yukashikado](https://github.com/toshiyuki-suzuki-yukashikado))

## 12.4.0 — 2023-05-08

_This version does not introduce any user-facing changes._

## 12.3.2 - 2023-03-03

### 🐛 Bug fixes

- Fixed Android property name of BarCodeScannedEvent from boundingBox to bounds to match TypeScript definitions ([#21384](https://github.com/expo/expo/pull/21384) by [@frw](https://github.com/frw))

## 12.3.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 12.3.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 12.2.0 — 2022-12-30

### 🎉 New features

- Native module for barcode scanner view is now written in Swift and Kotlin using the new API. ([#20441](https://github.com/expo/expo/pull/20441) and ([#20668](https://github.com/expo/expo/pull/20668) by [@alanhughes](https://github.com/alanjhughes))

## 12.1.0 - 2022-11-23

### 🐛 Bug fixes

- Fix import issue on case-sensitive file systems ([#20141](https://github.com/expo/expo/pull/20141) by [@hirbod](https://github.com/hirbod))

## 12.0.0 — 2022-10-25

### 🛠 Breaking changes

- Remove the manual re-export of `usePermissions` hook at package top level. ([#18630](https://github.com/expo/expo/pull/18630) by [@Simek](https://github.com/Simek))
- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))
- Made `cornerPoints` and `bounds` not optional in the `BarCodeScannerResult`. ([#19519](https://github.com/expo/expo/pull/19519) by [@lukmccall](https://github.com/lukmccall))

### 🐛 Bug fixes

- Fix camera not being correctly released on unmount (Android) ([#18768](https://github.com/expo/expo/pull/18768) by [@stefan-schweiger](https://github.com/stefan-schweiger))

### 💡 Others

- [plugin] Migrate import from @expo/config-plugins to expo/config-plugins and @expo/config-types to expo/config. ([#18855](https://github.com/expo/expo/pull/18855) by [@brentvatne](https://github.com/brentvatne))
- Drop `@expo/config-plugins` dependency in favor of peer dependency on `expo`. ([#18595](https://github.com/expo/expo/pull/18595) by [@EvanBacon](https://github.com/EvanBacon))

## 11.4.0 — 2022-07-07

_This version does not introduce any user-facing changes._

## 11.3.0 — 2022-04-18

### 🎉 New features

- On iOS 15.4+ added support for `Codabar` barcode type. ([#16703](https://github.com/expo/expo/pull/16703) by [@7nohe](https://github.com/7nohe))

### 💡 Others

- Updated `@expo/config-plugins` from `4.0.2` to `4.0.14` ([#15621](https://github.com/expo/expo/pull/15621) by [@EvanBacon](https://github.com/EvanBacon))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 11.2.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 11.2.0 — 2021-12-03

### 🐛 Bug fixes

- Fixed `BarCodeScanner` only scans on the first mount on Android. ([#15393](https://github.com/expo/expo/pull/15393) by [@lukmccall](https://github.com/lukmccall))
- Fixed crashes caused by the Zxing scanner on Android. ([#15394](https://github.com/expo/expo/pull/15394) by [@lukmccall](https://github.com/lukmccall))

## 11.1.0 — 2021-10-01

### 🐛 Bug fixes

- Added missing dependency on `expo-image-loader`. ([#14585](https://github.com/expo/expo/pull/14585) by [@tsapeta](https://github.com/tsapeta))

## 11.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🎉 New features

- Add BarCodeScanner.usePermissions hook from modules factory. ([#13852](https://github.com/expo/expo/pull/13852) by [@bycedric](https://github.com/bycedric))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13757](https://github.com/expo/expo/pull/13757) by [@tsapeta](https://github.com/tsapeta))
- Migrated Android codebase from Java to Kotlin. ([#13914](https://github.com/expo/expo/pull/13914) by [@m1st4ke](https://github.com/m1st4ke))
- Updated `@expo/config-plugins` ([#14443](https://github.com/expo/expo/pull/14443) by [@EvanBacon](https://github.com/EvanBacon))

## 10.2.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))
- On iOS removed the requirement for the presence of `NSMicrophoneUsageDescription` key in `Info.plist` ([#12860](https://github.com/expo/expo/pull/12772) by [@ajsmth](https://github.com/ajsmth))

### 💡 Others

- Migrated interfaces from their own packages to `expo-modules-core`. ([#12912](https://github.com/expo/expo/pull/12912) by [@tsapeta](https://github.com/tsapeta))

## 10.1.2 — 2021-04-13

_This version does not introduce any user-facing changes._

## 10.1.1 — 2021-03-31

_This version does not introduce any user-facing changes._

## 10.1.0 — 2021-03-10

### 🎉 New features

- Remove lodash. ([#11900](https://github.com/expo/expo/pull/11900) by [@EvanBacon](https://github.com/EvanBacon))
- Converted plugin to TypeScript. ([#11715](https://github.com/expo/expo/pull/11715) by [@EvanBacon](https://github.com/EvanBacon))
- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 10.0.0 — 2021-01-15

### ⚠️ Notices

- The package is now shipped with prebuilt binaries on iOS. You can read more about it on [expo.fyi/prebuilt-modules](https://expo.fyi/prebuilt-modules). ([#11224](https://github.com/expo/expo/pull/11224) by [@tsapeta](https://github.com/tsapeta))

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Created config plugins ([#11538](https://github.com/expo/expo/pull/11538) by [@EvanBacon](https://github.com/EvanBacon))

## 9.1.0 — 2020-11-17

### 🐛 Bug fixes

- Allow `onBarCodeScanned` prop to be `undefined`. ([#10068](https://github.com/expo/expo/pull/10068) by [@josmithua](https://github.com/josmithua))

## 9.0.0 — 2020-08-18

### 🛠 Breaking changes

- Added camera permissions declarations to `AndroidManifest.xml` on Android. ([#9227](https://github.com/expo/expo/pull/9227) by [@bycedric](https://github.com/bycedric))

### 🎉 New features

- Added constants on web. ([#4166](https://github.com/expo/expo/pull/4166) by [@EvanBacon](https://github.com/EvanBacon))
- Delete `prop-types` in favor of TypeScript. ([#8678](https://github.com/expo/expo/pull/8678) by [@EvanBacon](https://github.com/EvanBacon))
- `BarCodeScanner` is now returning barcode's bounding box on iOS. ([#8865](https://github.com/expo/expo/pull/8865) by [@lukmccall](https://github.com/lukmccall))

### 🐛 Bug fixes

- Fixed scanner throwing `NullPointerException` when barcode type isn't recognized on Android. ([#9006](https://github.com/expo/expo/pull/9006) by [@lukmccall](https://github.com/lukmccall))

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

_This version does not introduce any user-facing changes._
