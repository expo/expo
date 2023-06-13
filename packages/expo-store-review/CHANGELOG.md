# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

### 💡 Others

## 6.3.0 — 2023-05-08

_This version does not introduce any user-facing changes._

## 6.2.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 6.2.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 6.1.0 — 2022-12-30

### 🎉 New features

- Migrated Android implementation to Expo Modules API. ([#19898](https://github.com/expo/expo/pull/19898) by [@alanhughes](https://github.com/alanjhughes))

## 6.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Native module on iOS is now written in Swift using the Sweet API. ([#19467](https://github.com/expo/expo/pull/19467) by [@fobos531](https://github.com/fobos531))

## 5.3.0 — 2022-07-07

### 🐛 Bug fixes

- Fixed null pointer exception when store review request failed on Android. ([#16365](https://github.com/expo/expo/pull/16365) by [@mariomurrent-softwaresolutions](https://github.com/mariomurrent-softwaresolutions))

## 5.2.0 — 2022-04-18

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 5.1.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 5.1.0 — 2021-12-03

_This version does not introduce any user-facing changes._

## 5.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 5.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🎉 New features

- Update JS code to read manifest2 when manifest is not available. ([#13602](https://github.com/expo/expo/pull/13602) by [@wschurman](https://github.com/wschurman))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13757](https://github.com/expo/expo/pull/13757) by [@tsapeta](https://github.com/tsapeta))

## 4.1.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

## 4.0.2 — 2021-04-13

_This version does not introduce any user-facing changes._

## 4.0.1 — 2021-04-01

_This version does not introduce any user-facing changes._

## 4.0.0 — 2021-03-10

### 🛠 Breaking changes

- Removed `StoreReview.isSupported()` in favor of `StoreReview.isAvailableAsync()`. ([#11905](https://github.com/expo/expo/pull/11905) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 3.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 2.3.0 — 2020-11-17

### 🐛 Bug fixes

- [expo-store-review] Fix Android crash in failure path ([#10265](https://github.com/expo/expo/pull/10265) by [@danmaas](https://github.com/danmaas))

## 2.2.0 — 2020-08-20

### 🎉 New features

- Implemented native [In-App Review](https://developer.android.com/guide/playcore/in-app-review) for Android. ([#9607](https://github.com/expo/expo/pull/9607) by [@spezzino](https://github.com/spezzino))

## 2.1.3 — 2020-07-27

### 🐛 Bug fixes

- [store-review] Fix doc blocks. ([#8714](https://github.com/expo/expo/pull/8714) by [@EvanBacon](https://github.com/EvanBacon))

## 2.1.2 — 2020-05-29

_This version does not introduce any user-facing changes._

## 2.1.1 — 2020-05-27

_This version does not introduce any user-facing changes._
