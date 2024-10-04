# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

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
