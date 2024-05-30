# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

- Removed redundant usage of `EventEmitter` instance. ([#28946](https://github.com/expo/expo/pull/28946) by [@tsapeta](https://github.com/tsapeta))

## 8.0.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 8.0.0 — 2024-04-18

### 💡 Others

- drop unused web `name` property. ([#27437](https://github.com/expo/expo/pull/27437) by [@EvanBacon](https://github.com/EvanBacon))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 7.7.2 - 2023-12-19

_This version does not introduce any user-facing changes._

## 7.7.1 — 2023-12-12

_This version does not introduce any user-facing changes._

## 7.7.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

## 7.6.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

## 7.5.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

### 💡 Others

- Migrated Android codebase to use Expo Modules API. ([#23883](https://github.com/expo/expo/pull/23883) by [@lukmccall](https://github.com/lukmccall))

## 7.4.0 — 2023-08-02

_This version does not introduce any user-facing changes._

## 7.3.0 — 2023-06-13

### 📚 3rd party library updates

- Updated `robolectric` to `4.10` and `junit` to `4.13.2`. ([#22395](https://github.com/expo/expo/pull/22395) by [@josephyanks](https://github.com/josephyanks))

### 🎉 New features

- Added hooks `useBatteryLevel`, `useBatteryState`, `useLowPowerMode`, and `usePowerState`. ([#22646](https://github.com/expo/expo/pull/22646) by [@Adam-Schlichtmann](https://github.com/Adam-Schlichtmann))

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 7.2.0 — 2023-05-08

_This version does not introduce any user-facing changes._

## 7.1.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 7.1.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 7.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Native module on iOS is now written in Swift using the Sweet API. ([#19470](https://github.com/expo/expo/pull/19470) by [@fobos531](https://github.com/fobos531))

## 6.3.0 — 2022-07-07

_This version does not introduce any user-facing changes._

## 6.2.0 — 2022-04-18

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 6.1.1 - 2022-02-01

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

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Rewrite BatteryModule from Java to Kotlin. ([#13504](https://github.com/expo/expo/pull/13504) by [@mstach60161](https://github.com/mstach60161))
- Add unit tests. ([#13629](https://github.com/expo/expo/pull/13629) by [@mstach60161](https://github.com/mstach60161))
- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13757](https://github.com/expo/expo/pull/13757) by [@tsapeta](https://github.com/tsapeta))

## 5.0.0 — 2021-06-16

### 🛠 Breaking changes

- Removed following types: `BatteryLevelUpdateListener`, `BatteryStateUpdateListener` and `PowerModeUpdateListener` as they were only wrapping one-argument events responses. Use event types explicitly instead: `BatteryLevelEvent`, `BatteryStateEvent` and `PowerModeEvent`. ([#12592](https://github.com/expo/expo/pull/12592) by [@Simek](https://github.com/simek))

### 🎉 New features

- Added `isBatteryOptimizationEnabledAsync` method to check if the battery optimization is enabled on android. ([#13138](https://github.com/expo/expo/pull/13138) by [@FelipeACP](https://github.com/FelipeACP))

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 4.1.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 4.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 3.1.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 3.0.0 — 2020-08-18

### 🛠 Breaking changes

- Added support for FULL state on web. ([#8937](https://github.com/expo/expo/pull/8937) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Remove `fbjs` dependency. ([#8822](https://github.com/expo/expo/pull/8822) by [@EvanBacon](https://github.com/EvanBacon))

## 2.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 2.2.0 — 2020-05-27

### 🛠 Breaking changes

- Removed deprecated `isSupported` method. ([#7206](https://github.com/expo/expo/pull/7206) by [@bbarthec](https://github.com/bbarthec))
