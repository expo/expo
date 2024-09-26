# Changelog

## Unpublished

### 🛠 Breaking changes

- Bumped iOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

### 🐛 Bug fixes

- Add missing `react-native` peer dependencies for isolated modules. ([#30487](https://github.com/expo/expo/pull/30487) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Removed old `Platform.Version` checks. ([#31557](https://github.com/expo/expo/pull/31557) by [@reichhartd](https://github.com/reichhartd))

## 4.0.2 — 2024-04-29

_This version does not introduce any user-facing changes._

## 4.0.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 4.0.0 — 2024-04-18

### 🐛 Bug fixes

- Fix crash caused by accessing UIApplication apis off the main thread. ([#20272](https://github.com/expo/expo/pull/20272) by [@cltnschlosser](https://github.com/cltnschlosser))

### 💡 Others

- Prevent config plugin from writing permissions until prebuild. ([#28107](https://github.com/expo/expo/pull/28107) by [@EvanBacon](https://github.com/EvanBacon))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 3.3.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

### 🎉 New features

- Added function `getAdvertisingId`. ([#24777](https://github.com/expo/expo/pull/24777) by [@reichhartd](https://github.com/reichhartd))

## 3.2.0 — 2023-08-02

_This version does not introduce any user-facing changes._

## 3.1.0 — 2023-05-08

_This version does not introduce any user-facing changes._

## 3.0.3 — 2023-02-09

_This version does not introduce any user-facing changes._

## 3.0.2 — 2023-02-03

_This version does not introduce any user-facing changes._

## 3.0.1 — 2022-10-28

_This version does not introduce any user-facing changes._

## 3.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- [plugin] Migrate import from @expo/config-plugins to expo/config-plugins and @expo/config-types to expo/config. ([#18855](https://github.com/expo/expo/pull/18855) by [@brentvatne](https://github.com/brentvatne))
- Drop `@expo/config-plugins` dependency in favor of peer dependency on `expo`. ([#18595](https://github.com/expo/expo/pull/18595) by [@EvanBacon](https://github.com/EvanBacon))

## 2.3.1 — 2022-07-16

### 💡 Others

- Removed legacy Objective-C implementation and changed the pod name to `ExpoTrackingTransparency`. ([#18157](https://github.com/expo/expo/pull/18157) by [@barthap](https://github.com/barthap))

## 2.3.0 — 2022-07-07

### 💡 Others

- Migrated Expo modules definitions to the new naming convention. ([#17193](https://github.com/expo/expo/pull/17193) by [@tsapeta](https://github.com/tsapeta))

## 2.2.0 — 2022-04-18

### 💡 Others

- Updated `@expo/config-plugins` from `4.0.2` to `4.0.14` ([#15621](https://github.com/expo/expo/pull/15621) by [@EvanBacon](https://github.com/EvanBacon))

## 2.1.0 — 2021-12-03

_This version does not introduce any user-facing changes._

## 2.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 2.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🎉 New features

- Add `useTrackingPermissions` hook from modules factory. ([#13864](https://github.com/expo/expo/pull/13864) by [@bycedric](https://github.com/bycedric))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Updated `@expo/config-plugins` ([#14443](https://github.com/expo/expo/pull/14443) by [@EvanBacon](https://github.com/EvanBacon))

## 1.1.0 — 2021-06-16

### 💡 Others

- Migrated from `unimodules-permissions-interface` to `expo-modules-core`. ([#12961](https://github.com/expo/expo/pull/12961) by [@tsapeta](https://github.com/tsapeta))
- Export missing permission related types: `PermissionExpiration` and `PermissionStatus`. ([#13195](https://github.com/expo/expo/pull/13195) by [@Simek](https://github.com/Simek))

## 1.0.1 — 2021-05-21

_This version does not introduce any user-facing changes._

## 1.0.0 — 2021-05-18

### 🐛 Bug fixes

- Added check for native module availability in `.isAvailable()`. ([#12962](https://github.com/expo/expo/pull/12962) by [@cruzach](https://github.com/cruzach))
