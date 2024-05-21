# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- [Android] Fixed a crash when the source cannot be retrieved. ([#28961](https://github.com/expo/expo/pull/28961) by [@mrakesh0608](https://github.com/mrakesh0608))

### 💡 Others

## 8.0.0 — 2024-04-18

### 🐛 Bug fixes

- [Android] Enhanced resource management in VideoThumbnails module by ensuring closure of `ParcelFileDescriptor` and releasing `MediaMetadataRetriever` post-use. ([#26100](https://github.com/expo/expo/pull/26100) by [@hirbod](https://github.com/hirbod))

### 💡 Others

- drop unused web `name` property. ([#27437](https://github.com/expo/expo/pull/27437) by [@EvanBacon](https://github.com/EvanBacon))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 7.9.0 — 2023-12-12

### 🐛 Bug fixes

- [iOS] Fixed an issue where `timeFrame` exceeding video duration failed to generate a thumbnail. Implemented clamping. ([#25681](https://github.com/expo/expo/pull/25681) by [@hirbod](https://github.com/hirbod))

### 💡 Others

- [iOS] Replace legacy `FileSystem` interfaces usage with core `FileSystemUtilities`. ([#25495](https://github.com/expo/expo/pull/25495) by [@alanhughes](https://github.com/alanjhughes))

## 7.8.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

## 7.7.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

## 7.6.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

## 7.5.0 — 2023-08-02

_This version does not introduce any user-facing changes._

## 7.4.0 — 2023-06-21

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 7.3.0 — 2023-05-08

_This version does not introduce any user-facing changes._

## 7.2.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 7.2.0 — 2023-02-03

### 🎉 New features

- Native module on iOS is now written in Swift using the Sweet API. ([#19561](https://github.com/expo/expo/pull/19561) by [@fobos531](https://github.com/fobos531))
- Migrated Android codebase to use the new Expo modules API. ([#20541](https://github.com/expo/expo/pull/20541) by [@alanhughes](https://github.com/alanjhughes))

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 7.1.0 — 2022-12-30

### 🎉 New features

- Native module on iOS is now written in Swift using the Sweet API. ([#19561](https://github.com/expo/expo/pull/19561) by [@fobos531](https://github.com/fobos531))

## 7.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

## 6.4.0 — 2022-07-07

_This version does not introduce any user-facing changes._

## 6.3.0 — 2022-04-18

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 6.2.1 — 2022-03-29

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))
- Fix memory leak on iOS (imgRef was never released) ([#16132](https://github.com/expo/expo/pull/16132) by [@Hirbod](https://github.com/Hirbod) and [@bulgr0z](https://github.com/bulgr0z))

## 6.2.0 — 2021-12-18

### 🎉 New features

- Thumbnails can now be generated with `content://` paths on Android. ([#15553](https://github.com/expo/expo/pull/15553) by [@lukebrandonfarrell](https://github.com/lukebrandonfarrell))

## 6.1.1 — 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 6.1.0 — 2021-12-03

_This version does not introduce any user-facing changes._

## 6.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 6.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Set thumbnail generator tolerances to 0 in order to accurately retrieve an image at a specific time. ([#14253](https://github.com/expo/expo/pull/14253) by [@tamagokun](https://github.com/tamagokun))
- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13757](https://github.com/expo/expo/pull/13757) by [@tsapeta](https://github.com/tsapeta))

## 5.2.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Migrated from `unimodules-file-system-interface` to `expo-modules-core`.
- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))
- Change `VideoThumbnailsOptions` type definition of `headers` field to `Record`. ([#13193](https://github.com/expo/expo/pull/13193) by [@Simek](https://github.com/Simek))

## 5.1.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 5.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 4.4.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 4.3.0 — 2020-08-18

_This version does not introduce any user-facing changes._

## 4.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 4.2.0 — 2020-05-27

_This version does not introduce any user-facing changes._
