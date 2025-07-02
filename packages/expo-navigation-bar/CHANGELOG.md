# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 4.2.7 — 2025-07-02

_This version does not introduce any user-facing changes._

## 4.2.6 — 2025-06-18

_This version does not introduce any user-facing changes._

## 4.2.5 — 2025-06-04

### 🐛 Bug fixes

- Fix broken OS recognition. ([#36965](https://github.com/expo/expo/pull/36965) by [@behenate](https://github.com/behenate))

### 💡 Others

- Fix inconsistencies with the docs. ([#36966](https://github.com/expo/expo/pull/36966) by [@behenate](https://github.com/behenate))

## 4.2.4 — 2025-05-01

_This version does not introduce any user-facing changes._

## 4.2.3 — 2025-04-30

_This version does not introduce any user-facing changes._

## 4.2.2 — 2025-04-25

_This version does not introduce any user-facing changes._

## 4.2.1 — 2025-04-23

- Make `NavigationBar` methods no-op when edge-to-edge is enabled. ([#36330](https://github.com/expo/expo/pull/36330) by [@zoontek](https://github.com/zoontek))

## 4.2.0 — 2025-04-21

### 🎉 New features

- Use wrappers for methods from `react-native-edge-to-edge.SystemBars` when edge-to-edge is enabled. ([#36163](https://github.com/expo/expo/pull/36163) by [@behenate](https://github.com/behenate))

## 4.1.3 — 2025-04-14

_This version does not introduce any user-facing changes._

## 4.1.2 — 2025-04-09

_This version does not introduce any user-facing changes._

## 4.1.1 — 2025-04-08

_This version does not introduce any user-facing changes._

## 4.1.0 — 2025-04-04

- Warn about potential edge-to-edge interferences. ([#34478](https://github.com/expo/expo/pull/34478) by [@zoontek](https://github.com/zoontek))

### 🛠 Breaking changes

- upgrade RN to 0.78 ([#35050](https://github.com/expo/expo/pull/35050) by [@vonovak](https://github.com/vonovak))

### 💡 Others

- [Android] Started using expo modules gradle plugin. ([#34176](https://github.com/expo/expo/pull/34176) by [@lukmccall](https://github.com/lukmccall))
- [apple] Migrate remaining `expo-module.config.json` to unified platform syntax. ([#34445](https://github.com/expo/expo/pull/34445) by [@reichhartd](https://github.com/reichhartd))

## 4.0.9 - 2025-03-31

_This version does not introduce any user-facing changes._

## 4.0.8 - 2025-02-06

_This version does not introduce any user-facing changes._

## 4.0.7 - 2025-01-10

### 💡 Others

- Restricted color types to string to prevent the use of illegal color types (PlatformColor) until supported. ([#34053](https://github.com/expo/expo/pull/34053) by [@chrfalch](https://github.com/chrfalch))

## 4.0.6 - 2024-12-10

_This version does not introduce any user-facing changes._

## 4.0.5 - 2024-11-29

_This version does not introduce any user-facing changes._

## 4.0.4 — 2024-11-22

_This version does not introduce any user-facing changes._

## 4.0.3 — 2024-11-14

_This version does not introduce any user-facing changes._

## 4.0.2 — 2024-10-29

_This version does not introduce any user-facing changes._

## 4.0.1 — 2024-10-24

_This version does not introduce any user-facing changes._

## 4.0.0 — 2024-10-22

### 🐛 Bug fixes

- Add missing `react`/`react-native` peer dependencies. ([#30573](https://github.com/expo/expo/pull/30573) by [@byCedric](https://github.com/byCedric))
- Replaced the config-plugins deprecated `getAppThemeLightNoActionBarGroup` method with the new `getAppThemeGroup`. ([#30797](https://github.com/expo/expo/pull/30797) by [@zoontek](https://github.com/zoontek))

### 💡 Others

- Removed redundant usage of `EventEmitter` instance. ([#28946](https://github.com/expo/expo/pull/28946) by [@tsapeta](https://github.com/tsapeta))
- Standardized Babel configuration to use `expo-module-scripts`. ([#31915](https://github.com/expo/expo/pull/31915) by [@reichhartd](https://github.com/reichhartd))

### ⚠️ Notices

- Added support for React Native 0.76.x. ([#31552](https://github.com/expo/expo/pull/31552) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 3.0.7 - 2024-07-03

_This version does not introduce any user-facing changes._

## 3.0.6 - 2024-06-06

_This version does not introduce any user-facing changes._

## 3.0.5 - 2024-06-05

### 💡 Others

- Pin @react-native subpackage versions to 0.74.83. ([#29441](https://github.com/expo/expo/pull/29441) by [@kudo](https://github.com/kudo))

## 3.0.4 — 2024-05-02

_This version does not introduce any user-facing changes._

## 3.0.3 — 2024-05-01

_This version does not introduce any user-facing changes._

## 3.0.2 — 2024-04-23

_This version does not introduce any user-facing changes._

## 3.0.1 — 2024-04-22

_This version does not introduce any user-facing changes._

## 3.0.0 — 2024-04-18

### 🐛 Bug fixes

- Fix event listeners on Android. ([#28260](https://github.com/expo/expo/pull/28260) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 💡 Others

- Migrated dependency from `@react-native/normalize-color` to `@react-native/normalize-colors`. ([#27736](https://github.com/expo/expo/pull/27736) by [@kudo](https://github.com/kudo))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 2.8.1 - 2023-12-19

_This version does not introduce any user-facing changes._

## 2.8.0 — 2023-12-12

_This version does not introduce any user-facing changes._

## 2.7.0 — 2023-11-14

### 🛠 Breaking changes

- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

## 2.6.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

## 2.5.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

### 💡 Others

- Migrate to Expo Modules API. ([#23933](https://github.com/expo/expo/pull/23933) by [@alanjhughes](https://github.com/alanjhughes))

## 2.4.1 — 2023-08-02

### 🐛 Bug fixes

- Fix support for importing on iOS. ([#23761](https://github.com/expo/expo/pull/23761) by [@EvanBacon](https://github.com/EvanBacon))

## 2.4.0 — 2023-07-28

_This version does not introduce any user-facing changes._

## 2.3.0 — 2023-06-21

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 2.2.0 — 2023-05-08

### 💡 Others

- Android: Switch from deprecated `toLowerCase` to `lowercase` function ([#22225](https://github.com/expo/expo/pull/22225) by [@hbiede](https://github.com/hbiede))

## 2.1.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 2.1.0 — 2023-02-03

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 2.0.1 — 2022-10-28

_This version does not introduce any user-facing changes._

## 2.0.0 — 2022-10-25

### 🛠 Breaking changes

- [plugin] Upgrade minimum runtime requirement to Node 14 (LTS). ([#18204](https://github.com/expo/expo/pull/18204) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- [plugin] Migrate import from @expo/config-plugins to expo/config-plugins and @expo/config-types to expo/config. ([#18855](https://github.com/expo/expo/pull/18855) by [@brentvatne](https://github.com/brentvatne))
- Drop `@expo/config-plugins` dependency in favor of peer dependency on `expo`. ([#18595](https://github.com/expo/expo/pull/18595) by [@EvanBacon](https://github.com/EvanBacon))

## 1.3.0 — 2022-07-07

_This version does not introduce any user-facing changes._

## 1.2.0 — 2022-04-18

### 🐛 Bug fixes

- Fix `getVisiblilityAsync` crashing on Android 10 and older. ([#16445](https://github.com/expo/expo/pull/16445) by [@barthap](https://github.com/barthap))

### 💡 Others

- Updated `@expo/config-plugins` from `4.0.2` to `4.0.14` ([#15621](https://github.com/expo/expo/pull/15621) by [@EvanBacon](https://github.com/EvanBacon))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 1.1.2 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 1.1.1 — 2021-12-08

### 🐛 Bug fixes

- Return `hidden` from `useVisibility` hook on unsupported platforms. ([#15430](https://github.com/expo/expo/pull/15430) by [@EvanBacon](https://github.com/EvanBacon))
- Lazily initialize emitter to allow importing the module on unsupported platforms. ([#15430](https://github.com/expo/expo/pull/15430) by [@EvanBacon](https://github.com/EvanBacon))

## 1.1.0 — 2021-12-03

### 🐛 Bug fixes

- Fix border color warning ([#14950](https://github.com/expo/expo/pull/14950) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Added more useful resource for deprecated `visible` property ([#14809](https://github.com/expo/expo/pull/14809) by [@EvanBacon](https://github.com/EvanBacon))
