# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 3.8.0 — 2024-04-18

### 💡 Others

- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 3.7.2 - 2024-01-18

_This version does not introduce any user-facing changes._

## 3.7.1 - 2024-01-10

_This version does not introduce any user-facing changes._

## 3.7.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

### 💡 Others

- Renamed `unimodule.json` to `expo-module.config.json`. ([#25100](https://github.com/expo/expo/pull/25100) by [@reichhartd](https://github.com/reichhartd))

## 3.6.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

## 3.5.0 — 2023-09-15

### 🎉 New features

- Added support for Apple tvOS. ([#24329](https://github.com/expo/expo/pull/24329) by [@douglowder](https://github.com/douglowder))

## 3.4.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

## 3.3.0 — 2023-06-22

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))
- [iOS] Fix compile issue with native tests on Xcode 14. ([#22845](https://github.com/expo/expo/pull/22845) by [@douglowder](https://github.com/douglowder))

## 3.2.0 — 2023-06-21

### 📚 3rd party library updates

- Updated `junit` to `4.13.2`. ([#22395](https://github.com/expo/expo/pull/22395) by [@josephyanks](https://github.com/josephyanks))

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 3.1.2 — 2023-05-08

_This version does not introduce any user-facing changes._

## 3.1.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 3.1.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 3.0.1 — 2022-11-02

### 💡 Others

- Removed deprecated Android `kotlin-android-extensions` plugin ([#19732](https://github.com/expo/expo/pull/19732) by [@josephyanks](https://github.com/josephyanks))

## 3.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

## 2.2.1 — 2022-04-22

### 🐛 Bug fixes

- Stop prebuilding xcframework. ([#17161](https://github.com/expo/expo/pull/17161) by [@wschurman](https://github.com/wschurman))

## 2.2.0 — 2022-04-18

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 2.1.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 2.1.0 — 2021-12-03

### 🎉 New features

- Enable iOS `DEFINES_MODULE` for Swift integration. ([#15142](https://github.com/expo/expo/pull/15142) by [@kudo](https://github.com/kudo))

## 2.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

## 1.2.0 — 2021-09-09

_This version does not introduce any user-facing changes._

## 1.1.0 — 2021-06-08

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 1.0.1 — 2021-03-11

### 🐛 Bug fixes

- Fix warning in Xcode about wrong variable return type ([#12190](https://github.com/expo/expo/pull/12190) by [@esamelson](https://github.com/esamelson))
- Add prebuilt xcframework

## 1.0.0 — 2021-03-10

### 🎉 New features

- Added a full Android implementation of the structured fields specification, based on https://github.com/reschke/structured-fields ([#11856](https://github.com/expo/expo/pull/11856) by [@esamelson](https://github.com/esamelson))
- Added a partial iOS implementation of the structured fields specification - parsing, no serialization ([#11841](https://github.com/expo/expo/pull/11841) by [@esamelson](https://github.com/esamelson))
