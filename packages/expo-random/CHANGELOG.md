# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 13.2.0 — 2023-06-21

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 13.1.2 — 2023-05-08

_This version does not introduce any user-facing changes._

## 13.1.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 13.1.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

### ⚠️ Notices

- Deprecate the library in favor of expo-crypto. ([#20217](https://github.com/expo/expo/pull/20217) by [@aleqsio](https://github.com/aleqsio))

## 13.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

## 12.3.0 — 2022-07-07

### 🎉 New features

- The module on Android now uses JSI host object instead of the bridge module for communication between JavaScript and native code. ([#17613](https://github.com/expo/expo/pull/17613) by [@lukmccall](https://github.com/lukmccall))

### 💡 Others

- Migrated Expo modules definitions to the new naming convention. ([#17193](https://github.com/expo/expo/pull/17193) by [@tsapeta](https://github.com/tsapeta))

## 12.2.0 — 2022-04-18

### 🎉 New features

- The module on iOS is now written in Swift and uses JSI host object instead of the bridge module for communication between JavaScript and native code. ([#15875](https://github.com/expo/expo/pull/15875) by [@tsapeta](https://github.com/tsapeta))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 12.1.2 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 12.1.1 — 2021-12-18

### 🐛 Bug fixes

- Fix iOS project build break on SDK 44. ([#15626](https://github.com/expo/expo/pull/15626) by [@kudo](https://github.com/kudo))

## 12.1.0 — 2021-12-03

_This version does not introduce any user-facing changes._

## 12.0.1 — 2021-10-27

_This version does not introduce any user-facing changes._

## 12.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fix bug causing synchronous calls to break React Native Debugger. ([#13616](https://github.com/expo/expo/pull/13616) by [@stdavis](https://github.com/stdavis))
- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Rewrite android code to Kotlin. ([#13994](https://github.com/expo/expo/pull/13994) by [@kkafar](https://github.com/kkafar))

## 11.2.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 11.1.2 — 2021-04-13

_This version does not introduce any user-facing changes._

## 11.1.1 — 2021-04-09

_This version does not introduce any user-facing changes._

## 11.1.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

## 11.0.0 — 2021-01-15

### 🛠 Breaking changes

- Remove side-effect, binding the manifest environment variables to the app's `process.env` ([#11559](https://github.com/expo/expo/pull/11559) by [@EvanBacon](https://github.com/EvanBacon))
- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Export JSON from `react-native.config` ([#11456](https://github.com/expo/expo/pull/11456) by [@EvanBacon](https://github.com/EvanBacon))

## 10.0.0 — 2020-11-17

### 🛠 Breaking changes

- On iOS enabled `use_frameworks!` usage by replacing `React` dependency with `React-Core`. ([#11057](https://github.com/expo/expo/pull/11057) by [@bbarthec](https://github.com/bbarthec))

## 9.0.1 — 2020-10-28

### 🐛 Bug fixes

- Clarify that react-native-unimodules is a dependency in README
- Add a placeholder .xcodeproj file so that React Native CLI autolinking will detect the EXRandom podspec

## 9.0.0 — 2020-09-15

_This version does not introduce any user-facing changes._

## 8.3.0 — 2020-08-18

### 🎉 New features

- Add a synchronous version of `getRandomBytesAsync` called `getRandomBytes`. ([#9750](https://github.com/expo/expo/pull/9750) by [@brentvatne](https://github.com/brentvatne))

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

_This version does not introduce any user-facing changes._
