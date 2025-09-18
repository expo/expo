# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 12.0.9 — 2025-09-18

_This version does not introduce any user-facing changes._

## 12.0.8 — 2025-09-10

_This version does not introduce any user-facing changes._

## 12.0.7 — 2025-09-02

_This version does not introduce any user-facing changes._

## 12.0.6 — 2025-08-31

_This version does not introduce any user-facing changes._

## 12.0.5 — 2025-08-27

_This version does not introduce any user-facing changes._

## 12.0.4 — 2025-08-25

_This version does not introduce any user-facing changes._

## 12.0.3 — 2025-08-21

_This version does not introduce any user-facing changes._

## 12.0.2 — 2025-08-16

_This version does not introduce any user-facing changes._

## 12.0.1 — 2025-08-15

_This version does not introduce any user-facing changes._

## 12.0.0 — 2025-08-13

### 🎉 New features

- Add resource name validation for Android. ([#37322](https://github.com/expo/expo/pull/37322) by [@aleqsio](https://github.com/aleqsio))

### 🐛 Bug fixes

- [Android] fix file scheme handling in `downloadAsync` ([#38227](https://github.com/expo/expo/pull/38227) by [@vonovak](https://github.com/vonovak))

### 💡 Others

- [android] throw when loading empty font file ([#38229](https://github.com/expo/expo/pull/38229) by [@vonovak](https://github.com/vonovak))
- Update remaining `@expo/config-plugins` in config plugin to `expo/config-plugins` ([#38580](https://github.com/expo/expo/pull/38580) by [@kitten](https://github.com/kitten))

## 11.1.7 - 2025-07-03

_This version does not introduce any user-facing changes._

## 11.1.6 - 2025-07-01

### 💡 Others

- Remove "Please" from warnings and errors ([#36862](https://github.com/expo/expo/pull/36862) by [@brentvatne](https://github.com/brentvatne))

## 11.1.5 — 2025-05-03

_This version does not introduce any user-facing changes._

## 11.1.4 — 2025-04-30

_This version does not introduce any user-facing changes._

## 11.1.3 — 2025-04-25

_This version does not introduce any user-facing changes._

## 11.1.2 — 2025-04-14

### 💡 Others

- Added `file:///android_res/` format support. ([#36058](https://github.com/expo/expo/pull/36058) by [@kudo](https://github.com/kudo))

## 11.1.1 — 2025-04-09

_This version does not introduce any user-facing changes._

## 11.1.0 — 2025-04-04

### 🛠 Breaking changes

- Bump minimum macOS version to 11.0. ([#34980](https://github.com/expo/expo/pull/34980) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 🎉 New features

- Add RSC support. ([#34213](https://github.com/expo/expo/pull/34213) by [@EvanBacon](https://github.com/EvanBacon))
- Add .riv to accepted media types ([#35758](https://github.com/expo/expo/pull/35758) by [@alextoudic](https://github.com/alextoudic))

### 🐛 Bug fixes

- [macOS] Add macOS platform support ([#33505](https://github.com/expo/expo/pull/33505) by [@hassankhan](https://github.com/hassankhan))

### 💡 Others

- Deprecate `expo-asset/tools/hashAssetFiles` in favor of built-in hashing support in `expo/metro-config`. ([#34208](https://github.com/expo/expo/pull/34208) by [@EvanBacon](https://github.com/EvanBacon))
- [Android] Started using expo modules gradle plugin. ([#34176](https://github.com/expo/expo/pull/34176) by [@lukmccall](https://github.com/lukmccall))
- Drop `invariant` and `md5-file` dependencies. ([#35328](https://github.com/expo/expo/pull/35328) by [@kitten](https://github.com/kitten))
- [iOS] Fix warnings which will become errors in Swift 6. ([#35288](https://github.com/expo/expo/pull/35288) by [@behenate](https://github.com/behenate))

## 11.0.5 - 2025-03-20

_This version does not introduce any user-facing changes._

## 11.0.4 - 2025-02-19

_This version does not introduce any user-facing changes._

## 11.0.3 - 2025-01-31

_This version does not introduce any user-facing changes._

## 11.0.2 - 2025-01-10

_This version does not introduce any user-facing changes._

## 11.0.1 — 2024-11-10

### 🐛 Bug fixes

- Add support for simplified object asset format. ([#32728](https://github.com/expo/expo/pull/32728) by [@EvanBacon](https://github.com/EvanBacon))

## 11.0.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS and tvOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Add missing dependencies and follow proper dependency chains. ([#30500](https://github.com/expo/expo/pull/30500) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Remove unused `pathJoin` function. ([#29963](https://github.com/expo/expo/pull/29963) by [@EvanBacon](https://github.com/EvanBacon))
- Replaced `@testing-library/react-hooks` with `@testing-library/react-native`. ([#30742](https://github.com/expo/expo/pull/30742) by [@byCedric](https://github.com/byCedric))

## 10.0.10 - 2024-06-20

### 🐛 Bug fixes

- Fixed `PlatformUtils.ts` to have the correct export placeholders for react-native-web ([#29791](https://github.com/expo/expo/pull/29791) by [@Bram-dc](https://github.com/Bram-dc))
- Add missing `react` and `react-native` peer dependencies for isolated modules. ([#30454](https://github.com/expo/expo/pull/30454) by [@byCedric](https://github.com/byCedric))

## 10.0.9 - 2024-06-13

### 💡 Others

- Removed @react-native/assets-registry dependency. ([#29541](https://github.com/expo/expo/pull/29541) by [@kudo](https://github.com/kudo))

## 10.0.8 - 2024-06-06

_This version does not introduce any user-facing changes._

## 10.0.7 - 2024-06-05

### 💡 Others

- Pin @react-native subpackage versions to 0.74.83. ([#29441](https://github.com/expo/expo/pull/29441) by [@kudo](https://github.com/kudo))

## 10.0.6 — 2024-05-03

### 🐛 Bug fixes

- Fixed `downloadAsync()` does not support Android resources from release builds. ([#28604](https://github.com/expo/expo/pull/28604) by [@kudo](https://github.com/kudo))

## 10.0.5 — 2024-05-02

_This version does not introduce any user-facing changes._

## 10.0.4 — 2024-05-01

_This version does not introduce any user-facing changes._

## 10.0.3 — 2024-04-24

### 🐛 Bug fixes

- Fix `TypeError: (0, _ExpoAsset.downloadAsync) is not a function` when loading assets using Expo Web. ([#28405](https://github.com/expo/expo/pull/28405) by [@jamiees2](https://github.com/jamiees2))

### 💡 Others

- Update mocks for SDK51. ([#28424](https://github.com/expo/expo/pull/28424) by [@aleqsio](https://github.com/aleqsio))

## 10.0.2 — 2024-04-23

_This version does not introduce any user-facing changes._

## 10.0.1 — 2024-04-22

_This version does not introduce any user-facing changes._

## 10.0.0 — 2024-04-18

### 🎉 New features

- Added config plugin to allow assets to be linked at build time. ([#27052](https://github.com/expo/expo/pull/27052) by [@alanjhughes](https://github.com/alanjhughes))
- Add Apple TV support to the new iOS native module. ([#27823](https://github.com/expo/expo/pull/27823) by [@douglowder](https://github.com/douglowder))

### 🐛 Bug fixes

- Fixed "Tried to resolve a promise more than once" crash on iOS. ([#27672](https://github.com/expo/expo/pull/27672) by [@kudo](https://github.com/kudo))

### 💡 Others

- Create native module for iOS and Android. Migrate `downloadAsync` to a native implementation. ([#27369](https://github.com/expo/expo/pull/27369) by [@aleqsio](https://github.com/aleqsio))
- Remove MD5 checksum verification for remote assets. This does not change method signatures nor require changes to your application code, and should not affect any apps in practice since this behavior was used only for apps that used Classic Updates, support for which ended with SDK 50. ([#25614](https://github.com/expo/expo/pull/25614) by [@ide](https://github.com/ide))
- [expo-updates] Migrate to requireNativeModule/requireOptionalNativeModule. ([#25648](https://github.com/expo/expo/pull/25648) by [@wschurman](https://github.com/wschurman))
- Clean up some asset stuff. ([#26310](https://github.com/expo/expo/pull/26310) by [@wschurman](https://github.com/wschurman))
- Remove most of Constants.appOwnership. ([#26313](https://github.com/expo/expo/pull/26313) by [@wschurman](https://github.com/wschurman))
- Remove assetUrlOverride and assetMapOverride. ([#26314](https://github.com/expo/expo/pull/26314) by [@wschurman](https://github.com/wschurman))
- Improve updates types and clarity in expo-asset. ([#26337](https://github.com/expo/expo/pull/26337) by [@wschurman](https://github.com/wschurman))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 9.0.2 - 2024-01-05

### 🐛 Bug fixes

- Fix relative URLs and support for `unstable_path` in development. ([#26084](https://github.com/expo/expo/pull/26084) by [@EvanBacon](https://github.com/EvanBacon))

## 9.0.1 — 2023-12-13

_This version does not introduce any user-facing changes._

## 9.0.0 — 2023-12-12

### 🛠 Breaking changes

- Removed support for the Classic Updates service for SDK 50 ([announcement](https://blog.expo.dev/sunsetting-expo-publish-and-classic-updates-6cb9cd295378)). Specifically, references to the Classic Updates CDN were removed. [Migrate](https://docs.expo.dev/eas-update/migrate-from-classic-updates/) to EAS or other service that conforms to the modern [Expo Updates protocol](https://docs.expo.dev/technical-specs/expo-updates-1/). ([#25613](https://github.com/expo/expo/pull/25613) by [@ide](https://github.com/ide))

### 🎉 New features

- Added support for React Native 0.73.0. ([#24971](https://github.com/expo/expo/pull/24971), [#25453](https://github.com/expo/expo/pull/25453) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 💡 Others

- Removed references to legacy `bundledAssets` constant from `expo-file-system` that was used only in standalone apps. ([#25484](https://github.com/expo/expo/pull/25484) by [@tsapeta](https://github.com/tsapeta))

## 8.14.0 — 2023-11-14

### 🐛 Bug fixes

- fix URLs in development. ([#25202](https://github.com/expo/expo/pull/25202) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Collapse re-export of `react-native/Libraries/Image/AssetRegistry` to `@react-native/assets-registry/registry`. ([#25265](https://github.com/expo/expo/pull/25265) by [@EvanBacon](https://github.com/EvanBacon))
- Migrate to new standard `URL` support on native. ([#24941](https://github.com/expo/expo/pull/24941) by [@EvanBacon](https://github.com/EvanBacon))
- Renamed `unimodule.json` to `expo-module.config.json`. ([#25100](https://github.com/expo/expo/pull/25100) by [@reichhartd](https://github.com/reichhartd))

## 8.13.0 — 2023-10-17

### 🐛 Bug fixes

- URL encode asset paths defined as query parameter. ([#24562](https://github.com/expo/expo/pull/24562) by [@byCedric](https://github.com/byCedric))

## 8.12.1 — 2023-09-16

_This version does not introduce any user-facing changes._

## 8.12.0 — 2023-09-04

### 🛠 Breaking changes

- Convert `../` to `_` for the property `httpServerLocation` in `hashAssetFiles` (Metro asset pre-processor) to support assets in monorepos the same everywhere. ([#24090](https://github.com/expo/expo/pull/24090) by [@EvanBacon](https://github.com/EvanBacon))

## 8.11.0 — 2023-08-02

_This version does not introduce any user-facing changes._

## 8.10.1 — 2023-06-24

_This version does not introduce any user-facing changes._

## 8.10.0 — 2023-06-13

_This version does not introduce any user-facing changes._

## 8.9.2 — 2023-05-08

### 🐛 Bug fixes

- Fixed monorepo asset resolution in production for Metro web. ([#22094](https://github.com/expo/expo/pull/22094) by [@EvanBacon](https://github.com/EvanBacon))

## 8.9.1 - 2023-03-08

### 🐛 Bug fixes

- Fixed `@react-native/assets-registry` module not found issue on Web. ([#21469](https://github.com/expo/expo/pull/21469) by [@kudo](https://github.com/kudo))

## 8.9.0 — 2023-02-09

_This version does not introduce any user-facing changes._

## 8.8.0 — 2023-02-03

### 🐛 Bug fixes

- Fix loading Metro web assets from origins other than `/`. ([#20258](https://github.com/expo/expo/pull/20258) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Remove unused web features. ([#20258](https://github.com/expo/expo/pull/20258) by [@EvanBacon](https://github.com/EvanBacon))

## 8.6.2 — 2022-10-25

_This version does not introduce any user-facing changes._

## 8.6.1 — 2022-07-19

_This version does not introduce any user-facing changes._

## 8.6.0 — 2022-07-07

_This version does not introduce any user-facing changes._

## 8.5.0 — 2022-04-18

### 💡 Others

- Swap out Cloudfront CDN for `classic-assets.eascdn.net`. ([#15781](https://github.com/expo/expo/pull/15781)) by [@quinlanj](https://github.com/quinlanj)

## 8.4.6 - 2022-01-13

### 🐛 Bug fixes

- Fix missing `getManifest2()` function on web. ([#15891](https://github.com/expo/expo/pull/15891)) by [@jonsamp](https://github.com/jonsamp) ([#15891](https://github.com/expo/expo/pull/15891) by [@jonsamp](https://github.com/jonsamp))

## 8.4.5 — 2021-12-21

### 🐛 Bug fixes

- Fix an issue preventing the loading of assets using expo-updates manifests during local development. ([#15667](https://github.com/expo/expo/pull/15667)) by [@jonsamp](https://github.com/jonsamp)

## 8.4.4 — 2021-11-17

### 🐛 Bug fixes

- Fix `fromModule` on restrictive (Snack) web environments. ([#14435](https://github.com/expo/expo/pull/14435) by [@IjzerenHein](https://github.com/IjzerenHein))

## 8.4.1 — 2021-10-01

### 💡 Others

- Updated `@testing-library/react-hooks` to version `7.0.1`. ([#14552](https://github.com/expo/expo/pull/14552)) by [@Simek](https://github.com/Simek))

## 8.4.0 — 2021-09-08

### 🎉 New features

- Reapply [#12624](https://github.com/expo/expo/pull/12624) ([#13789](https://github.com/expo/expo/pull/13789) by [@jkhales](https://github.com/jkhales))

## 8.3.2 — 2021-04-21

### 🎉 New features

- Find local assets without extensions. ([#12624](https://github.com/expo/expo/pull/12624) by [@jkhales](https://github.com/jkhales))

## 8.3.1 — 2021-03-23

### 🐛 Bug fixes

- Removed annoying yellowbox warning message in bare workflow when there's no manifest available. ([#12237](https://github.com/expo/expo/pull/12237) by [@bbarthec](https://github.com/bbarthec))

## 8.3.0 — 2021-03-10

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 8.2.2 — 2021-01-15

_This version does not introduce any user-facing changes._

## 8.2.1 — 2020-11-17

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-08-18

### 🎉 New features

- Add `useAssets` hook to simplify assets handling. ([#8928](https://github.com/expo/expo/pull/8928) by [@bycedric](https://github.com/bycedric))

### 🐛 Bug fixes

- Fixed `Asset.loadAsync()` TypeScript signature to match `Asset.fromModule()` types. ([#9246](https://github.com/expo/expo/pull/9246) by [@barthap](https://github.com/barthap))

## 8.1.7 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.1.6 — 2020-05-27

_This version does not introduce any user-facing changes._

## 8.1.5

### 🎉 New features

- `asset.downloadAsync()` returns the resolved `Asset` when it resolves. ([#8646](https://github.com/expo/expo/pull/8646) by [@EvanBacon](https://github.com/EvanBacon))
- `Asset.loadAsync()` returns an array of resolved `Asset`s when it finishes loading the resources. ([#8646](https://github.com/expo/expo/pull/8646) by [@EvanBacon](https://github.com/EvanBacon))
- Added support for the `expo-updates` **no-publish workflow**. ([#8003](https://github.com/expo/expo/pull/8003) by [@esamelson](https://github.com/esamelson))
