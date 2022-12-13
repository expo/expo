# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- Fix import issue on case-sensitive file systems ([#20141](https://github.com/expo/expo/pull/20141) by [@hirbod](https://github.com/hirbod))

### 💡 Others

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
- Added support for string literal as bar code types input in iOS ([#11796](https://github.com/expo/expo/pull/11796) by [@jarvisluong](https://github.com/jarvisluong))

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
