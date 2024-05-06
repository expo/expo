# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 13.0.5 — 2024-05-06

_This version does not introduce any user-facing changes._

## 13.0.4 — 2024-05-01

_This version does not introduce any user-facing changes._

## 13.0.3 — 2024-04-24

### 💡 Others

- Update mocks for SDK51. ([#28424](https://github.com/expo/expo/pull/28424) by [@aleqsio](https://github.com/aleqsio))

## 13.0.2 — 2024-04-23

_This version does not introduce any user-facing changes._

## 13.0.1 — 2024-04-19

_This version does not introduce any user-facing changes._

## 13.0.0 — 2024-04-18

### 🐛 Bug fixes

- Prevent unnecessary permissions check when moving app to background (Would crash with certain configs). ([#28045](https://github.com/expo/expo/pull/28045) by [@cltnschlosser](https://github.com/cltnschlosser))
- Fix barometer updates not starting on iOS 17.4. ([#28253](https://github.com/expo/expo/pull/28253) by [@alanjhughes](https://github.com/alanjhughes))

### 💡 Others

- Prevent config plugin from writing permissions until prebuild. ([#28107](https://github.com/expo/expo/pull/28107) by [@EvanBacon](https://github.com/EvanBacon))
- drop unused web `name` property. ([#27437](https://github.com/expo/expo/pull/27437) by [@EvanBacon](https://github.com/EvanBacon))
- Fixed broken JavaScript unit tests. ([#27257](https://github.com/expo/expo/pull/27257) by [@kudo](https://github.com/kudo))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))
- Removed the usage of the legacy EventEmitter. ([#28149](https://github.com/expo/expo/pull/28149) by [@tsapeta](https://github.com/tsapeta))

## 12.9.1 - 2024-01-26

### 🐛 Bug fixes

- On `Android`, add event name to definition in the `DeviceMotionModule`. ([#26679](https://github.com/expo/expo/pull/26679) by [@alanjhughes](https://github.com/alanjhughes))

## 12.9.0 — 2023-12-12

### 🐛 Bug fixes

- [Android] Fix pedometer not working due to lack of permissions. ([#25815](https://github.com/expo/expo/pull/25815) by [@omegascorp](https://github.com/omegascorp) and [@behenate](https://github.com/behenate))
- On iOS, fix an issue where permissions were requested on reload. ([#25827](https://github.com/expo/expo/pull/25827) by [@alanjhughes](https://github.com/alanjhughes))

## 12.8.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

## 12.7.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

## 12.6.0 — 2023-09-15

### 💡 Others

- Migrated to Swift and Expo Modules API on iOS. ([#24133](https://github.com/expo/expo/pull/24133) by [@tsapeta](https://github.com/tsapeta))

## 12.5.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fix NullPointerException in PedometerModule. ([#24079](https://github.com/expo/expo/pull/24079) by [@jleprinc](https://github.com/jleprinc))

### 💡 Others

- Migrated Android codebase to use Expo modules API. ([#23906](https://github.com/expo/expo/pull/23906) by [@lukmccall](https://github.com/lukmccall))

## 12.4.1 — 2023-08-02

_This version does not introduce any user-facing changes._

## 12.4.0 — 2023-07-28

### 💡 Others

- Use absolute motion reference frame to calculate device rotation if available on iOS. ([#23738](https://github.com/expo/expo/pull/23738) by [@jkaufman](https://github.com/jkaufman))

## 12.3.0 — 2023-06-21

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 12.2.0 — 2023-05-08

_This version does not introduce any user-facing changes._

## 12.1.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 12.1.0 — 2023-02-03

### 🐛 Bug fixes

- Export types with type-only annotation to fix build when using `isolatedModules` flag. ([#20239](https://github.com/expo/expo/pull/20239) by [@zakharchenkoAndrii](https://github.com/zakharchenkoAndrii))

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 12.0.1 — 2022-10-27

_This version does not introduce any user-facing changes._

## 12.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Added support for the light sensor on Android. ([#18225](https://github.com/expo/expo/pull/18225) by [bearkillerPT](https://github.com/bearkillerPT))

### 💡 Others

- [plugin] Migrate import from @expo/config-plugins to expo/config-plugins and @expo/config-types to expo/config. ([#18855](https://github.com/expo/expo/pull/18855) by [@brentvatne](https://github.com/brentvatne))
- Drop `@expo/config-plugins` dependency in favor of peer dependency on `expo`. ([#18595](https://github.com/expo/expo/pull/18595) by [@EvanBacon](https://github.com/EvanBacon))
- Export Expo Modules permissions related types. ([#19525](https://github.com/expo/expo/pull/19525) by [@Simek](https://github.com/Simek))
- DeviceMotion: Add `DeviceMotionOrientation` enum. ([#19599](https://github.com/expo/expo/pull/19599) by [@Simek](https://github.com/Simek))

## 11.4.0 — 2022-07-07

_This version does not introduce any user-facing changes._

## 11.3.0 — 2022-04-27

### ⚠️ Notices

- Fixed exception on Android S+ devices for missing `HIGH_SAMPLING_RATE_SENSORS` permission. If the sensor update interval needs to be lower than 200ms, `HIGH_SAMPLING_RATE_SENSORS` should be explicitly added to **AndroidManifest.xml**. ([#17177](https://github.com/expo/expo/pull/17177) by [@kudo](https://github.com/kudo))

## 11.2.0 — 2022-04-18

### 💡 Others

- Updated `@expo/config-plugins` from `4.0.2` to `4.0.14` ([#15621](https://github.com/expo/expo/pull/15621) by [@EvanBacon](https://github.com/EvanBacon))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 11.1.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 11.1.0 — 2021-12-03

### 🐛 Bug fixes

- Fix Android crash caused by `assertSubscriptionAlive` method ([#14720](https://github.com/expo/expo/pull/14720) by [@zakharchenkoAndrii](https://github.com/zakharchenkoAndrii))

## 11.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 11.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Converted Android code to Kotlin ([#13738](https://github.com/expo/expo/pull/13738) by [@ixf](https://github.com/ixf))
- Updated `@expo/config-plugins` ([#14443](https://github.com/expo/expo/pull/14443) by [@EvanBacon](https://github.com/EvanBacon))

## 10.2.0 — 2021-06-16

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Migrated module interfaces from `unimodules-sensors-interface` to `expo-modules-core`. ([#12888](https://github.com/expo/expo/pull/12888) by [@tsapeta](https://github.com/tsapeta))
- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))
- Removed unnecessary dependency on `unimodules-permissions-interface`. ([#12961](https://github.com/expo/expo/pull/12961) by [@tsapeta](https://github.com/tsapeta))

## 10.1.2 — 2021-04-13

### 🎉 New features

- Added permissions-related methods `getPermissionsAsync` and `requestPermissionsAsync` what replaces deprecated `Permissions.askAsync()` and `Permissions.getAsync()`. ([#12501](https://github.com/expo/expo/pull/12501) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Replaced `Pedometer.watchStepCount()` return type (`PedometerListener`) with an unified Unimodules type - `Subscription`. ([#12497](https://github.com/expo/expo/pull/12497) by [@Simek](https://github.com/simek))

## 10.1.1 — 2021-04-01

_This version does not introduce any user-facing changes._

## 10.1.0 — 2021-03-10

### 🎉 New features

- Converted plugin to TypeScript. ([#11715](https://github.com/expo/expo/pull/11715) by [@EvanBacon](https://github.com/EvanBacon))
- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

## 10.0.0 — 2021-01-15

### ⚠️ Notices

- The package is now shipped with prebuilt binaries on iOS. You can read more about it on [expo.fyi/prebuilt-modules](https://expo.fyi/prebuilt-modules). ([#11224](https://github.com/expo/expo/pull/11224) by [@tsapeta](https://github.com/tsapeta))

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Created config plugins ([#11538](https://github.com/expo/expo/pull/11538) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Removed `fbjs` dependency ([#11396](https://github.com/expo/expo/pull/11396) by [@cruzach](https://github.com/cruzach))

## 9.2.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 9.1.0 — 2020-08-11

### 🐛 Bug fixes

- Ensure browser globals `DeviceMotionEvent` and `DeviceOrientationEvent` exist before attempting to read from them. ([#9236](https://github.com/expo/expo/pull/9236) by [@evanbacon](https://github.com/evanbacon))
- Fixed bug with low Barometer resolution on iOS. ([#9441](https://github.com/expo/expo/pull/9441) by [@barthap](https://github.com/barthap))

## 9.0.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 9.0.0 — 2020-05-27

### 🛠 Breaking changes

- `DeviceMotion.addListener` emits events with `rotationRate` in degrees instead of radians on all platforms. ([#7876](https://github.com/expo/expo/pull/7876) by [@evanbacon](https://github.com/evanbacon))
- `DeviceMotion.addListener` emits events with `rotationRate` in the form of alpha = x, beta = y, gamma = z on all platforms. ([#7876](https://github.com/expo/expo/pull/7876) by [@evanbacon](https://github.com/evanbacon))

### 🎉 New features

- `DeviceMotion.addListener` emits events with `interval` property. ([#7876](https://github.com/expo/expo/pull/7876) by [@evanbacon](https://github.com/evanbacon))

### 🐛 Bug fixes

- All sensors use more precise gravity `9.80665` instead of `9.8`. ([#7876](https://github.com/expo/expo/pull/7876) by [@evanbacon](https://github.com/evanbacon))
