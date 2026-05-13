# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 56.0.6 — 2026-05-13

_This version does not introduce any user-facing changes._

## 56.0.5 — 2026-05-11

_This version does not introduce any user-facing changes._

## 56.0.4 — 2026-05-08

### 🐛 Bug fixes

- Remove unnecessary warning when no icon is defined in the Expo config. ([#45515](https://github.com/expo/expo/pull/45515) by [@EvanBacon](https://github.com/EvanBacon))

## 56.0.3 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.2 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.1 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.0 — 2026-05-05

### 💡 Others

- Moved splash screen config plugins to `expo-splash-screen`. ([#44598](https://github.com/expo/expo/pull/44598) by [@zoontek](https://github.com/zoontek))
- Use `AndroidConfig.SystemBars` in default plugins. ([#44469](https://github.com/expo/expo/pull/44469) by [@zoontek](https://github.com/zoontek))
- Make splash screen `backgroundColor` optional, defaulting to `#ffffff`. ([#44098](https://github.com/expo/expo/pull/44098) by [@zoontek](https://github.com/zoontek))
- Removed unused `withAndroidSplashLegacyMainActivity` file. ([#43516](https://github.com/expo/expo/pull/43516) by [@zoontek](https://github.com/zoontek))
- Removed deprecated plugins. ([#43918](https://github.com/expo/expo/pull/43918) by [@kudo](https://github.com/kudo))
- [Internal] Drop peer dependency looping back to `expo` ([#45125](https://github.com/expo/expo/pull/45125) by [@kitten](https://github.com/kitten))

## 55.0.17 - 2026-05-05

_This version does not introduce any user-facing changes._

## 55.0.16 - 2026-04-21

_This version does not introduce any user-facing changes._

## 55.0.15 - 2026-04-13

_This version does not introduce any user-facing changes._

## 55.0.14 - 2026-04-09

_This version does not introduce any user-facing changes._

## 55.0.13 - 2026-04-07

_This version does not introduce any user-facing changes._

## 55.0.12 - 2026-04-02

_This version does not introduce any user-facing changes._

## 55.0.11 - 2026-03-27

_This version does not introduce any user-facing changes._

## 55.0.10 - 2026-03-18

_This version does not introduce any user-facing changes._

## 55.0.9 - 2026-03-17

_This version does not introduce any user-facing changes._

## 55.0.8 - 2026-02-26

### 🐛 Bug fixes

- Fixed `STATUS_BAR_PLUGIN` deprecation warning shown on prebuild for default `create-expo-app` template by no longer auto-populating `androidStatusBar.backgroundColor` from the splash background color. ([#43444](https://github.com/expo/expo/issues/43444)) ([#43453](https://github.com/expo/expo/pull/43453) by [@zoontek](https://github.com/zoontek))

## 55.0.7 — 2026-02-25

### 🛠 Breaking changes

- Remove the `androidNavigationBar.enforceContrast` and `androidNavigationBar.visible` properties handling (moved to the `expo-navigation-bar` plugin config). ([#43276](https://github.com/expo/expo/pull/43276) by [@zoontek](https://github.com/zoontek))

### 💡 Others

- Deprecated and turned into no-op the `androidNavigationBar.backgroundColor` app config property. ([#43276](https://github.com/expo/expo/pull/43276) by [@zoontek](https://github.com/zoontek))

## 55.0.6 — 2026-02-20

_This version does not introduce any user-facing changes._

## 55.0.5 — 2026-02-16

_This version does not introduce any user-facing changes._

## 55.0.4 — 2026-02-03

### 💡 Others

- remove deprecated `edgeToEdgeEnabled` field ([#42518](https://github.com/expo/expo/pull/42518) by [@vonovak](https://github.com/vonovak))

## 55.0.3 — 2026-01-26

_This version does not introduce any user-facing changes._

## 55.0.2 — 2026-01-23

_This version does not introduce any user-facing changes._

## 55.0.1 — 2026-01-22

_This version does not introduce any user-facing changes._

## 55.0.0 — 2026-01-21

### 🛠 Breaking changes

- remove expo-notifications from auto plugins; the `notification` entry in app.json is no longer valid ([#40787](https://github.com/expo/expo/pull/40787) by [@vonovak](https://github.com/vonovak))

### 🐛 Bug fixes

- Fix withEdgeToEdge types ([#41510](https://github.com/expo/expo/pull/41510) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Scope `.icon` build setting to app target. ([#41536](https://github.com/expo/expo/pull/41536) by [@patrickmichalik](https://github.com/patrickmichalik))

### ⚠️ Notices

- Added support for React Native 0.82.x. ([#39678](https://github.com/expo/expo/pull/39678) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Added support for React Native 0.83.x. ([#41564](https://github.com/expo/expo/pull/41564) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 54.0.7 - 2025-12-05

_This version does not introduce any user-facing changes._

## 54.0.6 - 2025-10-21

_This version does not introduce any user-facing changes._

## 54.0.5 - 2025-10-09

_This version does not introduce any user-facing changes._

## 54.0.4 - 2025-10-01

### 🐛 Bug fixes

- fixed race condition when generating ios splashscreen assets ([#37559](https://github.com/expo/expo/pull/37559) by [@alfonsocj](https://github.com/alfonsocj))

## 54.0.3 — 2025-09-12

### 🐛 Bug fixes

- Always set RCTNewArchEnabled ([#39626](https://github.com/expo/expo/pull/39626) by [@brentvatne](https://github.com/brentvatne))

## 54.0.2 — 2025-09-12

_This version does not introduce any user-facing changes._

## 54.0.1 — 2025-09-10

_This version does not introduce any user-facing changes._

## 54.0.0 — 2025-09-10

_This version does not introduce any user-facing changes._

## 10.0.8 — 2025-09-02

### 💡 Others

- warn when using the deprecated notification app config field ([#39325](https://github.com/expo/expo/pull/39325) by [@vonovak](https://github.com/vonovak))

## 10.0.7 — 2025-08-31

_This version does not introduce any user-facing changes._

## 10.0.6 — 2025-08-27

_This version does not introduce any user-facing changes._

## 10.0.5 — 2025-08-25

_This version does not introduce any user-facing changes._

## 10.0.4 — 2025-08-21

_This version does not introduce any user-facing changes._

## 10.0.3 — 2025-08-18

### 💡 Others

- Use React Native's `edgeToEdgeEnabled` Gradle property to provide edge-to-edge support. ([#38767](https://github.com/expo/expo/pull/38767) by [@behenate](https://github.com/behenate))

## 10.0.2 — 2025-08-16

### 💡 Others

- Switch autolinked package internal to `expo/internal/unstable-autolinking-exports` ([#38909](https://github.com/expo/expo/pull/38909) by [@kitten](https://github.com/kitten))

## 10.0.1 — 2025-08-15

_This version does not introduce any user-facing changes._

## 10.0.0 — 2025-08-13

### 🎉 New features

- Support Liquid Glass app icons. ([#37609](https://github.com/expo/expo/pull/37609) by [@alanjhughes](https://github.com/alanjhughes))
- [Android] Support `android.predictiveBackGestureEnabled` field in app config. ([#38774](https://github.com/expo/expo/pull/38774) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 🐛 Bug fixes

- revert remove `expo-notifications` from auto plugins ([#37886](https://github.com/expo/expo/pull/37886) by [@vonovak](https://github.com/vonovak))
- [Android] Fix splash screen icon not showing when app launched from push notifications ([#38700](https://github.com/expo/expo/pull/38700) by [@hirbod](https://github.com/hirbod))

### ⚠️ Notices

- Added support for React Native 0.80.x. ([#37400](https://github.com/expo/expo/pull/37400) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 9.0.11 - 2025-07-08

_This version does not introduce any user-facing changes._

## 9.0.10 - 2025-07-03

_This version does not introduce any user-facing changes._

## 9.0.9 - 2025-07-02

### 🎉 New features

- Add android config plugin for app name translation. ([#37202](https://github.com/expo/expo/pull/37202) by [@aleqsio](https://github.com/aleqsio))

## 9.0.7 - 2025-06-18

### 🐛 Bug fixes

- [reverted] remove `expo-notifications` from auto plugins ([#36873](https://github.com/expo/expo/pull/36873) by [@vonovak](https://github.com/vonovak))

### 💡 Others

- Remove "Please" from warnings and errors ([#36862](https://github.com/expo/expo/pull/36862) by [@brentvatne](https://github.com/brentvatne))

## 9.0.6 — 2025-05-06

_This version does not introduce any user-facing changes._

## 9.0.5 — 2025-05-01

_This version does not introduce any user-facing changes._

## 9.0.4 — 2025-04-30

_This version does not introduce any user-facing changes._

## 9.0.3 — 2025-04-30

_This version does not introduce any user-facing changes._

## 9.0.2 — 2025-04-25

_This version does not introduce any user-facing changes._

## 9.0.1 — 2025-04-21

_This version does not introduce any user-facing changes._

## 9.0.0 — 2025-04-14

_This version does not introduce any user-facing changes._

## 8.1.4 — 2025-04-14

_This version does not introduce any user-facing changes._

## 8.1.3 — 2025-04-11

### 🎉 New features

- [Android] Support `android.enableEdgeToEdge` field in app config. ([#35958](https://github.com/expo/expo/pull/35958) by [@behenate](https://github.com/behenate))

## 8.1.2 — 2025-04-09

_This version does not introduce any user-facing changes._

## 8.1.1 — 2025-04-08

_This version does not introduce any user-facing changes._

## 8.1.0 — 2025-04-04

### 🛠 Breaking changes

- upgrade RN to 0.78 ([#35050](https://github.com/expo/expo/pull/35050) by [@vonovak](https://github.com/vonovak))

### 💡 Others

- update JSC reference in prebuild template, fix its usage in `ReactNative78CompatPlugin` ([#35349](https://github.com/expo/expo/pull/35349) by [@vonovak](https://github.com/vonovak))
- Added `ReactNative78CompatPlugin` to support React Native 0.78. ([#33556](https://github.com/expo/expo/pull/33556) by [@kudo](https://github.com/kudo))
- Removed creating the bridging header from the defaults plugin and added it to the template instead. ([#33539](https://github.com/expo/expo/pull/33539) by [@tsapeta](https://github.com/tsapeta))
- Drop `fs-extra` in favor of `fs`. ([#35036](https://github.com/expo/expo/pull/35036) by [@kitten](https://github.com/kitten))

## 8.0.30 - 2025-03-31

_This version does not introduce any user-facing changes._

## 8.0.29 - 2025-03-11

_This version does not introduce any user-facing changes._

## 8.0.28 - 2025-02-19

_This version does not introduce any user-facing changes._

## 8.0.27 - 2025-02-14

_This version does not introduce any user-facing changes._

## 8.0.26 - 2025-02-06

_This version does not introduce any user-facing changes._

## 8.0.24 - 2025-01-08

_This version does not introduce any user-facing changes._

## 8.0.23 - 2024-12-10

_This version does not introduce any user-facing changes._

## 8.0.22 - 2024-12-05

_This version does not introduce any user-facing changes._

## 8.0.21 - 2024-11-29

### 💡 Others

- Fixed compatibility for React Native 0.78 nightlies. ([#33306](https://github.com/expo/expo/pull/33306) by [@kudo](https://github.com/kudo))

## 8.0.20 — 2024-11-22

_This version does not introduce any user-facing changes._

## 8.0.19 — 2024-11-22

### 💡 Others

- Added React Native 0.77 support for Kotlin and NDK version bumps. ([#33073](https://github.com/expo/expo/pull/33073) by [@kudo](https://github.com/kudo))

## 8.0.18 — 2024-11-20

_This version does not introduce any user-facing changes._

## 8.0.17 — 2024-11-14

_This version does not introduce any user-facing changes._

## 8.0.16 — 2024-11-14

### 🐛 Bug fixes

- [Android] Fix app icon generation. ([#32908](https://github.com/expo/expo/pull/32908) by [@alanjhughes](https://github.com/alanjhughes))

## 8.0.15 — 2024-11-14

_This version does not introduce any user-facing changes._

## 8.0.14 — 2024-11-13

### 🐛 Bug fixes

- Ensure image resource section exists in `SplashScreen.storyboard`. ([#32858](https://github.com/expo/expo/pull/32858) by [@alanjhughes](https://github.com/alanjhughes))

## 8.0.13 — 2024-11-12

### 💡 Others

- Vary android styles depending on config ([#32776](https://github.com/expo/expo/pull/32776) by [@alanjhughes](https://github.com/alanjhughes))

## 8.0.12 — 2024-11-11

_This version does not introduce any user-facing changes._

## 8.0.11 — 2024-11-11

### 💡 Others

- Improved resolving the path to `expo-modules-autolinking` and removed a peer dependency. ([#32554](https://github.com/expo/expo/pull/32554) by [@tsapeta](https://github.com/tsapeta))

## 8.0.10 — 2024-11-07

### 🐛 Bug fixes

- [android] Fix prebuild error due to float icon coordinates. ([#32649](https://github.com/expo/expo/pull/32649) by [@aleqsio](https://github.com/aleqsio))

## 8.0.9 — 2024-11-06

### 💡 Others

- Rename ios.icon.any to ios.icon.light for consistency with Apple docs ([#32636](https://github.com/expo/expo/pull/32636) by [@brentvatne](https://github.com/brentvatne))

## 8.0.8 — 2024-11-05

_This version does not introduce any user-facing changes._

## 8.0.7 — 2024-10-31

_This version does not introduce any user-facing changes._

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
