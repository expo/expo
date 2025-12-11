# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 1.0.10 — 2025-12-05

_This version does not introduce any user-facing changes._

## 1.0.9 — 2025-09-18

_This version does not introduce any user-facing changes._

## 1.0.8 — 2025-09-11

_This version does not introduce any user-facing changes._

## 1.0.7 — 2025-09-02

_This version does not introduce any user-facing changes._

## 1.0.6 — 2025-08-31

_This version does not introduce any user-facing changes._

## 1.0.5 — 2025-08-27

_This version does not introduce any user-facing changes._

## 1.0.4 — 2025-08-25

_This version does not introduce any user-facing changes._

## 1.0.3 — 2025-08-18

### 💡 Others

- [ios] Removed `buildFromSource` option on iOS.

## 1.0.2 — 2025-08-16

_This version does not introduce any user-facing changes._

## 1.0.1 — 2025-08-15

### 🎉 New features

- Add `ios.reactNativeReleaseLevel` option ([#38840](https://github.com/expo/expo/pull/38840) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 1.0.0 — 2025-08-13

### 🎉 New features

- [ios] Added default support for prebuilt React Native Core. Can be disabled via `ios.buildReactNativeFromSource` in eas.json. (Renamed Android prop as well to align) ([#38400](https://github.com/expo/expo/pull/38400) by [@chrfalch](https://github.com/chrfalch))
- Added support for prebuilt React Native iOS dependencies via `ios.buildFromSource: false` in the iOS build properties. When `buildFromSource` is disabled, it sets `ENV['RCT_USE_RN_DEP'] = '1'` in the Podfile to use prebuilt third-party dependencies, as described in the [React Native 0.80 release blog post](https://reactnative.dev/blog/2025/06/12/react-native-0.80#experimental---react-native-ios-dependencies-are-now-prebuilt). ([#37678](https://github.com/expo/expo/pull/37678) by [@huextrat](https://github.com/huextrat))
- Add `android.buildArchs` option to override the default `reactNativeArchitectures` value in gradle.properties ([#37831](https://github.com/expo/expo/pull/37831) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Add support for setting Android's exclusiveMavenMirror gradle property ([#37864](https://github.com/expo/expo/pull/37864) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Add android.reactNativeReleaseLevel option ([#38698](https://github.com/expo/expo/pull/38698) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 💡 Others

- [android] Deprecate `enableProguardInReleaseBuilds` in favor of `enableMinifyInReleaseBuilds` ([#38627](https://github.com/expo/expo/pull/38627) by [@nishan](https://github.com/intergalacticspacehighway))

## 0.14.8 - 2025-07-01

### 💡 Others

- Added `System.getenv()` syntax support to the tsdoc for `AndroidMavenRepositoryCredentials`. ([#37344](https://github.com/expo/expo/pull/37344) by [@kudo](https://github.com/kudo))

## 0.14.7 - 2025-06-30

### 🎉 New features

- Add `android.buildFromSource` option ([#37745](https://github.com/expo/expo/pull/37745) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 0.14.6 — 2025-04-30

_This version does not introduce any user-facing changes._

## 0.14.5 — 2025-04-25

_This version does not introduce any user-facing changes._

## 0.14.4 — 2025-04-14

_This version does not introduce any user-facing changes._

## 0.14.3 — 2025-04-11

_This version does not introduce any user-facing changes._

## 0.14.2 — 2025-04-11

### 🎉 New features

- Add `android.enableBundleCompression` option ([#36071](https://github.com/expo/expo/pull/36071) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 0.14.1 — 2025-04-09

_This version does not introduce any user-facing changes._

## 0.14.0 — 2025-04-04

### 🎉 New features

- Add `android.useDayNightTheme` to enable overriding the templates use of a light theme. ([#33989](https://github.com/expo/expo/pull/33989) by [@alanjhughes](https://github.com/alanjhughes))

### 🐛 Bug fixes

- Fixed generating falsy properties to overwrite existing props. ([#35771](https://github.com/expo/expo/pull/35771) by [@kudo](https://github.com/kudo))

## 0.13.2 - 2025-01-10

_This version does not introduce any user-facing changes._

## 0.13.1 — 2024-10-24

_This version does not introduce any user-facing changes._

## 0.13.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- Export missing types. ([#29401](https://github.com/expo/expo/pull/29401) by [@Simek](https://github.com/Simek))
- Deprecate `android.newArchEnabled` and `ios.newArchEnabled` in favor of app config `newArchEnabled`. ([#31963](https://github.com/expo/expo/pull/31963) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 0.12.5 - 2024-08-07

_This version does not introduce any user-facing changes._

## 0.12.4 - 2024-07-30

### 🎉 New features

- Add `android.enablePngCrunchInReleaseBuilds` to enable toggling PNG crunching in release builds. ([#30699](https://github.com/expo/expo/pull/30699) by [@brentvatne](https://github.com/brentvatne))

## 0.12.3 - 2024-06-06

### 🎉 New features

- `ios.privacyManifestAggregationEnabled` is now enabled by default. ([#29439](https://github.com/expo/expo/pull/29439) by [@alanjhughes](https://github.com/alanjhughes))

## 0.12.2 - 2024-06-05

### 🐛 Bug fixes

- Improved android manifest queries, preventing overrides of <package> tags and splitting <provider> instead of merging them into one string ([#29418](https://github.com/expo/expo/pull/29418) by [@Titozzz](https://github.com/Titozzz))

## 0.12.1 — 2024-05-06

### 🎉 New features

- Add `ios.ccacheEnabled` option to enable the C++ compiler cache for iOS builds. ([#28638](https://github.com/expo/expo/pull/28638) by [@byCedric](https://github.com/byCedric))
- Add `ios.privacyManifestAggregationEnabled` option to enable/disable privacy manifest aggregation. ([#28646](https://github.com/expo/expo/pull/28646) by [@brentvatne](https://github.com/brentvatne)).

## 0.12.0 — 2024-04-18

### 🛠 Breaking changes

- Removed Flipper support. ([#26581](https://github.com/expo/expo/pull/26581) by [@kudo](https://github.com/kudo))

### 🎉 New features

- Expand `android.extraMavenRepos` to allow authentication-required Maven repositories. ([#26895](https://github.com/expo/expo/pull/26895) by [@bpeltonc](https://github.com/bpeltonc))
- Added `extraPods` and `extraMavenRepos` supports within `withBuildProperties()` that library authors could reuse in third-party libraries. ([#28106](https://github.com/expo/expo/pull/28106) by [@kudo](https://github.com/kudo))

### 📚 3rd party library updates

- update semver from 7.5.3 to 7.5.4. ([#26876](https://github.com/expo/expo/pull/26876) by [@GaelCO](https://github.com/GaelCO))

## 0.11.1 - 2024-02-01

### 🎉 New features

- Added `useLegacyPackaging` property to instruct AGP to compress native libraries in the APK. ([#26779](https://github.com/expo/expo/pull/26779) by [@alanjhughes](https://github.com/alanjhughes))

## 0.11.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 0.10.0 — 2023-10-17

### 🎉 New features

- Add `android.manifestQueries` to allow adding and modifying the `<queries>` tag in the App Manifest. ([#24619](https://github.com/expo/expo/pull/24619) by [@alanjhughes](https://github.com/alanjhughes))

## 0.9.1 — 2023-09-04

_This version does not introduce any user-facing changes._

## 0.9.0 — 2023-07-28

_This version does not introduce any user-facing changes._

## 0.8.3 — 2023-06-28

_This version does not introduce any user-facing changes._

## 0.8.2 — 2023-06-27

### 💡 Others

- Upgrade `semver` lib. ([#23113](https://github.com/expo/expo/pull/23113) by [@felipemillhouse](https://github.com/felipemillhouse))

## 0.8.1 — 2023-06-23

_This version does not introduce any user-facing changes._

## 0.8.0 — 2023-06-21

### 🛠 Breaking changes

- Replaced `unstable_networkInspector` as `networkInspector` and enabled the feature by default. ([#22994](https://github.com/expo/expo/pull/22994) by [@kudo](https://github.com/kudo))

### 🎉 New features

- Added `android.extraMavenRepos` and `ios.extraPods` support. ([#22785](https://github.com/expo/expo/pull/22785) by [@kudo](https://github.com/kudo))
- Added `android.usesCleartextTraffic` support. ([#23043](https://github.com/expo/expo/pull/23043) by [@alanjhughes](https://github.com/alanjhughes))

## 0.7.0 — 2023-05-08

### 🐛 Bug fixes

- Fixed false alarm error throwing when `ios.flipper=false` and `useFrameworks`. ([#22296](https://github.com/expo/expo/pull/22296) by [@kudo](https://github.com/kudo))

## 0.6.0 - 2023-04-14

### 🎉 New features

- Added experimental `unstable_networkInspector` properties. ([#22129](https://github.com/expo/expo/pull/22129) by [@kudo](https://github.com/kudo))

## 0.5.2 — 2023-04-03

### 🎉 New features

- Added `enableShrinkResourcesInReleaseBuilds` property to enable Android `shrinkResources` build feature. ([#21911](https://github.com/expo/expo/pull/21911) by [@kudo](https://github.com/kudo))

## 0.5.1 — 2023-02-09

### 🎉 New features

- Add support for enabling [Flipper](https://fbflipper.com/) as bundled with react-native. ([#20890](https://github.com/expo/expo/pull/20861) by [@jakobo](https://github.com/jakobo))

## 0.5.0 — 2023-02-03

### 🎉 New features

- Add support for enabling [React Native new architecture mode](https://reactnative.dev/docs/new-architecture-intro). ([#20861](https://github.com/expo/expo/pull/20861) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 0.4.1 - 2022-11-24

### 🐛 Bug fixes

- Fixed `extraProguardRules` be overwritten from multiple `withBuildProperties` execution. ([#20106](https://github.com/expo/expo/pull/20106) by [@kudo](https://github.com/kudo))

## 0.4.0 — 2022-10-25

### 🛠 Breaking changes

- [plugin] Upgrade minimum runtime requirement to Node 14 (LTS). ([#18204](https://github.com/expo/expo/pull/18204) by [@EvanBacon](https://github.com/EvanBacon))
- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- Drop `@expo/config-plugins` dependency in favor of peer dependency on `expo`. ([#18595](https://github.com/expo/expo/pull/18595) by [@EvanBacon](https://github.com/EvanBacon))

## 0.3.0 — 2022-07-07

### 🎉 New features

- Add `android.minSdkVersion` to override the minimum required Android SDK version. ([#17647](https://github.com/expo/expo/pull/17647) by [@Kudo](https://github.com/Kudo))
