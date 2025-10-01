# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 0.12.8 — 2025-10-01

### 🐛 Bug fixes

- [iOS] Add workaround for iOS 26 onTapGesture known issue ([#39849](https://github.com/expo/expo/pull/39849) by [@nishan](https://github.com/intergalacticspacehighway))

## 0.12.7 — 2025-09-11

_This version does not introduce any user-facing changes._

## 0.12.6 — 2025-09-02

_This version does not introduce any user-facing changes._

## 0.12.5 — 2025-08-31

_This version does not introduce any user-facing changes._

## 0.12.4 — 2025-08-27

_This version does not introduce any user-facing changes._

## 0.12.3 — 2025-08-25

_This version does not introduce any user-facing changes._

## 0.12.2 — 2025-08-16

_This version does not introduce any user-facing changes._

## 0.12.1 — 2025-08-15

_This version does not introduce any user-facing changes._

## 0.12.0 — 2025-08-13

### 🎉 New features

- Add `contentPadding` property to the `GoogleMaps.View` component on Android. ([#38382](https://github.com/expo/expo/pull/38382) by [@nishan](https://github.com/intergalacticspacehighway))
- Add anchor and zIndex support to GoogleMapsView markers. ([#38357](https://github.com/expo/expo/pull/38357) by [@shollington-rbi](https://github.com/shollington-rbi))
- Add support for Google Maps styling with JSON configuration and `mapId` property. ([#38493](https://github.com/expo/expo/pull/38493) by [@nishan](https://github.com/intergalacticspacehighway))
- Add points of interest filter, elevation and emphasis styling to Apple maps. ([#38514](https://github.com/expo/expo/pull/38514) by [@nishan](https://github.com/intergalacticspacehighway))

### 🐛 Bug fixes

- Fix onMapClick and onMapLongClick nesting. ([#37059](https://github.com/expo/expo/pull/37059) by [@jakex7](https://github.com/jakex7))

### 💡 Others

- Fixed `ExpoComposeView` breaking change errors. ([#36256](https://github.com/expo/expo/pull/36256) by [@kudo](https://github.com/kudo))

## 0.11.0 - 2025-06-18

### 🎉 New features

- Add `isMyLocationEnabled` prop on iOS. ([#36741](https://github.com/expo/expo/pull/36741) by [@fobos531](https://github.com/fobos531))

## 0.10.0 — 2025-05-08

### 🎉 New features

- Add polyline rendering support on Android and iOS. ([#36236](https://github.com/expo/expo/pull/36236) by [@fobos531](https://github.com/fobos531))
- Add circle rendering support on Android and iOS. ([#36439](https://github.com/expo/expo/pull/36439) by [@fobos531](https://github.com/fobos531))

## 0.9.9 — 2025-05-06

### 🎉 New features

- [iOS] Added Look Around support. ([#36415](https://github.com/expo/expo/pull/36415) by [@fobos531](https://github.com/fobos531))
- Add polyline rendering support on Android and iOS. ([#36236](https://github.com/expo/expo/pull/36236) by [@fobos531](https://github.com/fobos531))

## 0.9.8 — 2025-04-30

### 🎉 New features

- Added `id` property to markers and polylines. ([#36422](https://github.com/expo/expo/pull/36422) by [@fobos531](https://github.com/fobos531))
- Add polyline rendering support on Android and iOS. ([#36236](https://github.com/expo/expo/pull/36236) by [@fobos531](https://github.com/fobos531))
- Add polygons rendering support on Android and iOS. ([#36606](https://github.com/expo/expo/pull/36606) by [@fobos531](https://github.com/fobos531))

## 0.9.7 — 2025-04-28

### 🎉 New features

- Add polyline rendering support on Android and iOS. ([#36236](https://github.com/expo/expo/pull/36236) by [@fobos531](https://github.com/fobos531))

## 0.9.6 — 2025-04-26

### 💡 Others

- [iOS] Lower minimum supported version to iOS 17. ([#36400](https://github.com/expo/expo/pull/36400) by [@alanjhughes](https://github.com/alanjhughes))

## 0.9.5 — 2025-04-25

_This version does not introduce any user-facing changes._

## 0.9.4 — 2025-04-21

### 🐛 Bug fixes

- Exported missing config plugin. ([#36177](https://github.com/expo/expo/pull/36177) by [@lukmccall](https://github.com/lukmccall))

## 0.9.3 — 2025-04-14

_This version does not introduce any user-facing changes._

## 0.9.2 — 2025-04-14

_This version does not introduce any user-facing changes._

## 0.9.1 — 2025-04-09

_This version does not introduce any user-facing changes._

## 0.9.0 — 2025-04-08

### 🛠 Breaking changes

- [Android] Add zoom, tilt, bearing to StreetView position ([#35938](https://github.com/expo/expo/pull/35938) by [@jakex7](https://github.com/jakex7))

## 0.8.0 — 2025-04-04

### 🛠 Breaking changes

- upgrade RN to 0.78 ([#35050](https://github.com/expo/expo/pull/35050) by [@vonovak](https://github.com/vonovak))

### 🐛 Bug fixes

- [Android] fix updating cameraPosition prop ([#35883](https://github.com/expo/expo/pull/35883) by [@jakex7](https://github.com/jakex7))

### 💡 Others

- [Android] Started using expo modules gradle plugin. ([#34176](https://github.com/expo/expo/pull/34176) by [@lukmccall](https://github.com/lukmccall))
- [apple] Migrate remaining `expo-module.config.json` to unified platform syntax. ([#34445](https://github.com/expo/expo/pull/34445) by [@reichhartd](https://github.com/reichhartd))
- Standardize platform key ordering in `expo-module.config.json`. ([#35003](https://github.com/expo/expo/pull/35003) by [@reichhartd](https://github.com/reichhartd))
- Migrated SwiftUI views with backward compatible `WithHostingView`. ([#35553](https://github.com/expo/expo/pull/35553) by [@kudo](https://github.com/kudo))

## 0.7.3 - 2025-02-14

### 🎉 New features

- [iOS] Implement setCameraPosition ([#34886](https://github.com/expo/expo/pull/34886) by [@jakex7](https://github.com/jakex7))

## 0.7.2 - 2025-02-10

_This version does not introduce any user-facing changes._

## 0.7.1 - 2025-02-06

_This version does not introduce any user-facing changes._

## 0.6.1 — 2024-10-29

_This version does not introduce any user-facing changes._

## 0.6.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Removed usage of reserved keyword `module`. ([#30010](https://github.com/expo/expo/pull/30010) by [@EvanBacon](https://github.com/EvanBacon))
- Add missing `react` and `react-native` peer dependencies for isolated modules. ([#30475](https://github.com/expo/expo/pull/30475) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Removed redundant usage of `EventEmitter` instance. ([#28946](https://github.com/expo/expo/pull/28946) by [@tsapeta](https://github.com/tsapeta))
- Removed all `NativeModulesProxy` occurrences. ([#31496](https://github.com/expo/expo/pull/31496) by [@reichhartd](https://github.com/reichhartd))
- Removed old `Platform.Version` checks. ([#31557](https://github.com/expo/expo/pull/31557) by [@reichhartd](https://github.com/reichhartd))
- Standardized Babel configuration to use `expo-module-scripts`. ([#31915](https://github.com/expo/expo/pull/31915) by [@reichhartd](https://github.com/reichhartd))

## 0.5.0 - 2024-09-23

### 💡 Others

- drop unused web `name` property. ([#27437](https://github.com/expo/expo/pull/27437) by [@EvanBacon](https://github.com/EvanBacon))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 0.4.1 - 2024-01-24

### 💡 Others

- Replace deprecated `com.facebook.react:react-native:+` Android dependency with `com.facebook.react:react-android`. ([#26237](https://github.com/expo/expo/pull/26237) by [@kudo](https://github.com/kudo))

## 0.4.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

## 0.3.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

### 💡 Others

- Ship untranspiled JSX to support custom handling of `jsx` and `createElement`. ([#24889](https://github.com/expo/expo/pull/24889) by [@EvanBacon](https://github.com/EvanBacon))

## 0.2.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

## 0.1.0 — 2023-06-21

### 🐛 Bug fixes

- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

### 💡 Others

- Moved the Google-Maps-iOS-Utils dependency to rely on git remote instead of a published package. ([#21249](https://github.com/expo/expo/pull/21249) by [@aleqsio](https://github.com/aleqsio))

## 0.0.2 — 2023-02-09

_This version does not introduce any user-facing changes._

## 0.0.1 — 2023-02-03

_This version does not introduce any user-facing changes._
