# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 13.0.1 — 2024-10-22

_This version does not introduce any user-facing changes._

## 13.0.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

## 12.7.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 12.7.0 — 2024-04-18

### 💡 Others

- drop unused web `name` property. ([#27437](https://github.com/expo/expo/pull/27437) by [@EvanBacon](https://github.com/EvanBacon))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 12.6.1 - 2023-12-19

### 🛠 Breaking changes

- `expo-face-detector` is now deprecated. We recommed using [react-native-vision-camera](https://github.com/mrousavy/react-native-vision-camera) instead. ([#26026](https://github.com/expo/expo/pull/26026) by [@alanjhughes](https://github.com/alanjhughes))

## 12.6.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

### 💡 Others

- Migrated codebase to use Expo Modules API. ([#24994](https://github.com/expo/expo/pull/24994) by [@lukmccall](https://github.com/lukmccall))
- Renamed `unimodule.json` to `expo-module.config.json`. ([#25100](https://github.com/expo/expo/pull/25100) by [@reichhartd](https://github.com/reichhartd))

## 12.5.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

## 12.4.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

## 12.3.0 — 2023-08-02

_This version does not introduce any user-facing changes._

## 12.2.0 — 2023-06-21

### 🛠 Breaking changes

- Removed face detector from Expo Go on iOS. (https://expo.fyi/face-detector-removed). ([#22619](https://github.com/expo/expo/pull/22619) by [@aleqsio](https://github.com/aleqsio))

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 12.1.2 — 2023-05-08

_This version does not introduce any user-facing changes._

## 12.1.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 12.1.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 12.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

## 11.3.0 — 2022-07-07

_This version does not introduce any user-facing changes._

## 11.2.0 — 2022-04-18

### 🐛 Bug fixes

- Fix inverted values of `FaceDetectorLandmarks` and `FaceDetectorClassifications` enums. ([#16114](https://github.com/expo/expo/pull/16114) by [@Simek](https://github.com/Simek))

### ⚠️ Notices

- On iOS bumped `GoogleMLKit/FaceDetection@2.1.0 ➡️ 2.6.0`, `MLKitFaceDetection@1.2.0 ➡️ 1.5.0`, `MLKitCommon@2.1.0 ➡️ 5.0.0` and `MLKitVision@1.2.0 ➡️ 3.0.0`. ([#17002](https://github.com/expo/expo/pull/17002) by [@bbarthec](https://github.com/bbarthec))
- On Android bumped `androidx.exifinterface:exifinterface:1.0.0 ➡️ 1.3.3`. ([#17002](https://github.com/expo/expo/pull/17002) by [@bbarthec](https://github.com/bbarthec))
- On Android migrated from `com.google.firebase:firebase-ml-vision:24.0.1` and `com.google.firebase:firebase-ml-vision-face-model:19.0.0` to `com.google.mlkit:face-detection:16.1.5`. ([#17002](https://github.com/expo/expo/pull/17002) by [@bbarthec](https://github.com/bbarthec))
- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 11.1.3 - 2022-02-04

_This version does not introduce any user-facing changes._

## 11.1.2 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 11.1.1 — 2021-12-08

_This version does not introduce any user-facing changes._

## 11.1.0 — 2021-12-03

### 💡 Others

- Rewritten module to Kotlin. ([#14943](https://github.com/expo/expo/pull/14943) by [@mstach60161](https://github.com/mstach60161))

## 11.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 11.0.0 — 2021-09-28

### 🛠 Breaking changes

- Replace exported `FaceDetector.Constants.*` with String Enums (`FaceDetector.FaceDetectorMode`, `FaceDetector.FaceDetectorLandmarks` and `FaceDetector.FaceDetectorClassifications`). ([#14179](https://github.com/expo/expo/pull/14179) by [@Simek](https://github.com/Simek))
- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13757](https://github.com/expo/expo/pull/13757) by [@tsapeta](https://github.com/tsapeta))
- Extract `detectFacesAsync` options as separate type named `DetectionOptions`. ([#14179](https://github.com/expo/expo/pull/14179) by [@Simek](https://github.com/Simek))
- Add missing `minDetectionInterval` and `tracking` parameters to the `DetectionOptions` type. ([#14179](https://github.com/expo/expo/pull/14179) by [@Simek](https://github.com/Simek))

## 10.1.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Migrated from `unimodules-face-detector-interface` and `unimodules-file-system-interface` to `expo-modules-core`. ([#12936](https://github.com/expo/expo/pull/12936) by [@tsapeta](https://github.com/tsapeta))
- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 10.0.1 — 2021-03-23

_This version does not introduce any user-facing changes._

## 10.0.0 — 2021-03-10

### 📚 native library updates

- Migrated from `Firebase/MLVision` native library to `GoogleMLKit/FaceDetection@2.1.0` on iOS. ([#12125](https://github.com/expo/expo/pull/12125) by [@bbarthec](https://github.com/bbarthec))

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

## 9.0.1 — 2021-01-15

_This version does not introduce any user-facing changes._

## 9.0.0 — 2021-01-15

### ⚠️ Notices

- The package is now shipped with prebuilt binaries on iOS. You can read more about it on [expo.fyi/prebuilt-modules](https://expo.fyi/prebuilt-modules). ([#11224](https://github.com/expo/expo/pull/11224) by [@tsapeta](https://github.com/tsapeta))

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 8.4.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 8.3.0 — 2020-08-18

_This version does not introduce any user-facing changes._

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

### 🎉 New features

- Added support for overriding the iOS Firebase SDK version in the bare workflow. ([#7141](https://github.com/expo/expo/pull/7141) by [@IjzerenHein](https://github.com/IjzerenHein))
