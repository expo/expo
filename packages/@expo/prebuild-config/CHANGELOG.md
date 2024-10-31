# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 8.0.6 — 2024-10-31

_This version does not introduce any user-facing changes._

## 8.0.5 — 2024-10-29

_This version does not introduce any user-facing changes._

## 8.0.4 — 2024-10-28

_This version does not introduce any user-facing changes._

## 8.0.3 — 2024-10-25

_This version does not introduce any user-facing changes._

## 8.0.2 — 2024-10-24

_This version does not introduce any user-facing changes._

## 8.0.1 — 2024-10-22

### 💡 Others

- Fixed check-package test errors. ([#32232](https://github.com/expo/expo/pull/32232) by [@kudo](https://github.com/kudo))

## 8.0.0 — 2024-10-22

### 🎉 New features

- Added `ios.developmentTeam` to change the Apple development team id. ([#30761](https://github.com/expo/expo/pull/30761) by [@byCedric](https://github.com/byCedric))
- Added support for specifying iOS 18+ icon variants. ([#30247](https://github.com/expo/expo/pull/30247) by [@fobos531](https://github.com/fobos531))
- Added `newArchitecture` prop to app config schema. ([#31963](https://github.com/expo/expo/pull/31963) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 🐛 Bug fixes

- Fix empty splash config resulting in build error. ([#29497](https://github.com/expo/expo/pull/29497) by [@aleqsio](https://github.com/aleqsio))
- Fix incorrect dependency imports. ([#30553](https://github.com/expo/expo/pull/30553) by [@byCedric](https://github.com/byCedric))
- Replaced the config-plugins deprecated `getAppThemeLightNoActionBarGroup` method with the new `getAppThemeGroup`. ([#30797](https://github.com/expo/expo/pull/30797) by [@zoontek](https://github.com/zoontek))

### ⚠️ Notices

- Added support for React Native 0.76.x. ([#31552](https://github.com/expo/expo/pull/31552) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 7.0.8 - 2024-07-11

_This version does not introduce any user-facing changes._

## 7.0.7 - 2024-07-03

_This version does not introduce any user-facing changes._

## 7.0.6 - 2024-06-06

_This version does not introduce any user-facing changes._

## 7.0.5 - 2024-06-05

### 💡 Others

- Pin @react-native subpackage versions to 0.74.83. ([#29441](https://github.com/expo/expo/pull/29441) by [@kudo](https://github.com/kudo))

## 7.0.4 — 2024-05-16

_This version does not introduce any user-facing changes._

## 7.0.3 — 2024-05-02

_This version does not introduce any user-facing changes._

## 7.0.2 — 2024-05-01

_This version does not introduce any user-facing changes._

## 7.0.1 — 2024-04-22

_This version does not introduce any user-facing changes._

## 7.0.0 — 2024-04-19

_This version does not introduce any user-facing changes._

## 7.0.0-beta.0 — 2024-04-17

### 🛠 Breaking changes

- [iOS] remove default APNS entitlement. ([#27924](https://github.com/expo/expo/pull/27924) by [@douglowder](https://github.com/douglowder))

### 🎉 New features

- Include new privacy info plugin in default plugins. ([#28005](https://github.com/expo/expo/pull/28005) by [@aleqsio](https://github.com/aleqsio))
- Add default icon on iOS to prevent submission failure when no `icon` is defined. ([#27774](https://github.com/expo/expo/pull/27774) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Improve config plugin testing. ([#28107](https://github.com/expo/expo/pull/28107) by [@EvanBacon](https://github.com/EvanBacon))
- Remove classic updates SDK version. ([#26061](https://github.com/expo/expo/pull/26061) by [@wschurman](https://github.com/wschurman))
- Migrated dependency from `@react-native/normalize-color` to `@react-native/normalize-colors`. ([#27736](https://github.com/expo/expo/pull/27736) by [@kudo](https://github.com/kudo))

### 📚 3rd party library updates

- update semver from 7.5.3 to 7.5.4. ([#26876](https://github.com/expo/expo/pull/26876) by [@GaelCO](https://github.com/GaelCO))

## 6.7.4 - 2024-01-23

### 🐛 Bug fixes

- Fixed splash screen backgroundColor not applied, by reverting [#25971](https://github.com/expo/expo/pull/25971). ([#26536](https://github.com/expo/expo/pull/26536) by [@kudo](https://github.com/kudo)) ([#25971](https://github.com/expo/expo/pull/25971), [#26536](https://github.com/expo/expo/pull/26536) by [@kudo](https://github.com/kudo))

## 6.7.3 - 2024-01-05

### 🐛 Bug fixes

- Fixed white splash screen flickering in dark mode. ([#25933](https://github.com/expo/expo/pull/25933) by [@kudo](https://github.com/kudo))

## 6.7.2 - 2023-12-19

### 🐛 Bug fixes

- Move `expo-module-scripts` to `devDependencies` instead of `peerDependencies`. ([#25994](https://github.com/expo/expo/pull/25994) by [@byCedric](https://github.com/byCedric))

## 6.7.1 — 2023-12-15

_This version does not introduce any user-facing changes._

## 6.7.0 — 2023-12-12

### 🎉 New features

- Added support for React Native 0.73.0. ([#24971](https://github.com/expo/expo/pull/24971), [#25453](https://github.com/expo/expo/pull/25453) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 💡 Others

- Replace `@expo/babel-preset-cli` with `expo-module-scripts`. ([#25423](https://github.com/expo/expo/pull/25423) by [@byCedric](https://github.com/byCedric))

## 6.6.0 — 2023-11-14

### 💡 Others

- Update snapshot tests. ([#25211](https://github.com/expo/expo/pull/25211) by [@EvanBacon](https://github.com/EvanBacon))

## 6.5.0 — 2023-10-17

### 💡 Others

- Transpile for Node 18 (LTS). ([#24471](https://github.com/expo/expo/pull/24471) by [@EvanBacon](https://github.com/EvanBacon))
- Improve `expo-modules-autolinking` integration from its new public exported APIs. ([#24650](https://github.com/expo/expo/pull/24650) by [@kudo](https://github.com/kudo))

## 6.4.1 — 2023-09-15

_This version does not introduce any user-facing changes._

## 6.4.0 — 2023-09-04

### 🛠 Breaking changes

- Remove classic updates. ([#24066](https://github.com/expo/expo/pull/24066) by [@wschurman](https://github.com/wschurman))

## 6.3.0 — 2023-07-28

_This version does not introduce any user-facing changes._

## 6.2.4 — 2023-06-27

### 💡 Others

- Upgrade `semver` lib. ([#23113](https://github.com/expo/expo/pull/23113) by [@felipemillhouse](https://github.com/felipemillhouse))

## 6.2.3 — 2023-06-24

### 🐛 Bug fixes

- Removed the deprecated `withPackageManifest` plugin to fix build warning on Android. ([#23056](https://github.com/expo/expo/pull/23056) by [@kudo](https://github.com/kudo))

## 6.2.2 — 2023-06-23

### 💡 Others

- Update snapshots. ([#23043](https://github.com/expo/expo/pull/23043) by [@alanjhughes](https://github.com/alanjhughes))

## 6.2.1 — 2023-06-22

### 🛠 Breaking changes

- Generate universal 1024x1024 iOS icon only. Supports [Xcode +14 only](https://developer.apple.com/documentation/xcode-release-notes/xcode-14-release-notes), min iOS 12, min watchOS 4. ([#22833](https://github.com/expo/expo/pull/22833) by [@EvanBacon](https://github.com/EvanBacon))

## 6.2.0 — 2023-06-21

### 💡 Others

- Update `xml2js` version. ([#22872](https://github.com/expo/expo/pull/22872) by [@EvanBacon](https://github.com/EvanBacon))

## 6.1.0 — 2023-06-13

### 🎉 New features

- Added support for React Native 0.72. ([#22588](https://github.com/expo/expo/pull/22588) by [@kudo](https://github.com/kudo))

## 6.0.2 — 2023-05-08

### 💡 Others

- Update tests to use latest Expo template. ([#21339](https://github.com/expo/expo/pull/21339) by [@EvanBacon](https://github.com/EvanBacon))
- Update build files. ([#21941](https://github.com/expo/expo/pull/21941) by [@EvanBacon](https://github.com/EvanBacon))

## 6.0.1 - 2023-04-26

### 🐛 Bug fixes

- Fix missing `await` syntax that was causing build error for `android.adapative.monochromeImage` field, if specified in `app.json`. [#22000](https://github.com/expo/expo/pull/22000) by [@amandeepmittal](https://github.com/amandeepmittal))

## 6.0.0 — 2023-02-03

### 🛠 Breaking changes

- Removed deprecated facebook types and plugins. ([#21018](https://github.com/expo/expo/pull/21018) by [@byCedric](https://github.com/expo/expo/pull/21018))

### 🎉 New features

- Switch default JS engine to Hermes. ([#21001](https://github.com/expo/expo/pull/21001) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 💡 Others

- Bump `@expo/json-file`. ([#20720](https://github.com/expo/expo/pull/20720) by [@EvanBacon](https://github.com/EvanBacon))
- Removed warning about the (deprecated property) `expo.ios.splash.xib` being unsupported. ([#20377](https://github.com/expo/expo/pull/20377) by [@EvanBacon](https://github.com/EvanBacon))
- Fix tests. ([#20379](https://github.com/expo/expo/pull/20379) by [@EvanBacon](https://github.com/EvanBacon))
