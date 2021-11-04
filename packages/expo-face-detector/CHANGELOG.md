# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

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
