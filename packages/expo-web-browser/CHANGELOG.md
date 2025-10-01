# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 15.0.8 — 2025-10-01

### 🐛 Bug fixes

- [Android] Fix multiple runs of prebuild repeateadly adding generated code. ([#39702](https://github.com/expo/expo/pull/39702) by [@alanjhughes](https://github.com/alanjhughes))

## 15.0.7 — 2025-09-11

_This version does not introduce any user-facing changes._

## 15.0.6 — 2025-09-02

_This version does not introduce any user-facing changes._

## 15.0.5 — 2025-08-31

_This version does not introduce any user-facing changes._

## 15.0.4 — 2025-08-27

_This version does not introduce any user-facing changes._

## 15.0.3 — 2025-08-25

_This version does not introduce any user-facing changes._

## 15.0.2 — 2025-08-16

_This version does not introduce any user-facing changes._

## 15.0.1 — 2025-08-15

_This version does not introduce any user-facing changes._

## 15.0.0 — 2025-08-13

_This version does not introduce any user-facing changes._

## 14.2.0 - 2025-06-11

### 🎉 New features

- Add experimental macOS support ([#37352](https://github.com/expo/expo/pull/37352) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 14.1.6 — 2025-04-30

_This version does not introduce any user-facing changes._

## 14.1.5 — 2025-04-25

_This version does not introduce any user-facing changes._

## 14.1.4 — 2025-04-21

### 🐛 Bug fixes

- Fixed `openBrowserAsync` doesn't surface exceptions. ([#36182](https://github.com/expo/expo/pull/36182) by [@lukmccall](https://github.com/lukmccall))

## 14.1.3 — 2025-04-14

_This version does not introduce any user-facing changes._

## 14.1.2 — 2025-04-11

### 💡 Others

- Update doc comment about `--https` flag. ([#36083](https://github.com/expo/expo/pull/36083) by [@EvanBacon](https://github.com/EvanBacon))

## 14.1.1 — 2025-04-09

_This version does not introduce any user-facing changes._

## 14.1.0 — 2025-04-04

### 🎉 New features

- Add config plugin to enable correct behavior on android.([#34160](https://github.com/expo/expo/pull/34160) by [@alanjhughes](https://github.com/alanjhughes))

### 🐛 Bug fixes

- [iOS] Fix an issue where the app will crash when using the popover presentation style on iPad. ([#33996](https://github.com/expo/expo/pull/33996) by [@jblarriviere](https://github.com/jblarriviere))
- [Android] Fix an issue where the browser would close when returning from the background.([#34160](https://github.com/expo/expo/pull/34160) by [@alanjhughes](https://github.com/alanjhughes))

### 💡 Others

- [Android] Started using expo modules gradle plugin. ([#34176](https://github.com/expo/expo/pull/34176) by [@lukmccall](https://github.com/lukmccall))
- [apple] Migrate remaining `expo-module.config.json` to unified platform syntax. ([#34445](https://github.com/expo/expo/pull/34445) by [@reichhartd](https://github.com/reichhartd))

## 14.0.2 - 2025-01-10

_This version does not introduce any user-facing changes._

## 14.0.1 — 2024-11-14

_This version does not introduce any user-facing changes._

## 14.0.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840), [#30864](https://github.com/expo/expo/pull/30864) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- [iOS] `dismissBrowser` function updated to return a promise. ([#31210](https://github.com/expo/expo/pull/31210) by [@nishan](https://github.com/intergalacticspacehighway))

### 🐛 Bug fixes

- Add missing `react-native` peer dependencies for isolated modules. ([#30490](https://github.com/expo/expo/pull/30490) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Removed old `Platform.Version` checks. ([#31557](https://github.com/expo/expo/pull/31557) by [@reichhartd](https://github.com/reichhartd))

## 13.0.3 — 2024-04-29

### 🐛 Bug fixes

- On `iOS`, fix an issue where rapidly opening and closing the browser would leave the module in a bad state, preventing opening the browser again. ([#28452](https://github.com/expo/expo/pull/28452) by [@alanjhughes](https://github.com/alanjhughes))

## 13.0.2 — 2024-04-24

_This version does not introduce any user-facing changes._

## 13.0.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 13.0.0 — 2024-04-18

### 💡 Others

- drop unused web `name` property. ([#27437](https://github.com/expo/expo/pull/27437) by [@EvanBacon](https://github.com/EvanBacon))
- Update error message to reflect that web crypto works on web with a localhost hostname and often doesn't require `https`. ([#26729](https://github.com/expo/expo/pull/26729) by [@EvanBacon](https://github.com/EvanBacon))
- Remove `compare-urls` and `url` dependencies in favor of built-in URL support. ([#26702](https://github.com/expo/expo/pull/26702) by [@EvanBacon](https://github.com/EvanBacon))
- Removed deprecated backward compatible Gradle settings. ([#28083](https://github.com/expo/expo/pull/28083) by [@kudo](https://github.com/kudo))

## 12.8.2 - 2024-01-24

### 💡 Others

- Updated `androidx.browser:browser` to `1.6.0` [#26619](https://github.com/expo/expo/pull/26619) by [@zoontek](https://github.com/zoontek)

## 12.8.1 - 2023-12-19

_This version does not introduce any user-facing changes._

## 12.8.0 — 2023-11-14

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- On `Android` bump `compileSdkVersion` and `targetSdkVersion` to `34`. ([#24708](https://github.com/expo/expo/pull/24708) by [@alanjhughes](https://github.com/alanjhughes))

## 12.7.0 — 2023-10-17

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

## 12.6.0 — 2023-09-15

_This version does not introduce any user-facing changes._

## 12.5.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

## 12.4.1 — 2023-08-02

_This version does not introduce any user-facing changes._

## 12.4.0 — 2023-07-28

_This version does not introduce any user-facing changes._

## 12.3.2 — 2023-06-28

_This version does not introduce any user-facing changes._

## 12.3.1 — 2023-06-27

### 🐛 Bug fixes

- On `iOS`, fixed crash when opening an invalid URL in the web browser. ([#22986](https://github.com/expo/expo/pull/23084) by [@hirbod](https://github.com/hirbod))

## 12.3.0 — 2023-06-21

### 📚 3rd party library updates

- Updated `robolectric` to `4.10`. ([#22395](https://github.com/expo/expo/pull/22395) by [@josephyanks](https://github.com/josephyanks))

### 🐛 Bug fixes

- On `iOS` fix browser session being kept alive after view controller is dismissed. ([#22415](https://github.com/expo/expo/pull/22415) by [@alanjhughes](https://github.com/alanjhughes))
- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 12.2.0 — 2023-05-08

_This version does not introduce any user-facing changes._

## 12.1.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 12.1.0 — 2023-02-03

### 🐛 Bug fixes

- Add missing peer dependency on `url` for web. ([#20708](https://github.com/expo/expo/pull/20708) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))

## 12.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Support CSS colors in `controlsColor`, `toolbarColor` and `secondaryToolbarColor` options. ([#18586](https://github.com/expo/expo/pull/18586) by [@janicduplessis](https://github.com/janicduplessis))

### 💡 Others

- Update docs to remove mentions of `expo start:web`. ([#18419](https://github.com/expo/expo/pull/18419) by [@EvanBacon](https://github.com/EvanBacon))

## 11.0.0 — 2022-07-07

### 🎉 New features

- Native module on Android is now written in Kotlin using the new API. ([#17454](https://github.com/expo/expo/pull/17454) by [@barthap](https://github.com/barthap))

### 🐛 Bug fixes

- Fixed `removeListener(): Method has been deprecated` warning. ([#17645](https://github.com/expo/expo/pull/17645) by [@barthap](https://github.com/barthap))
- Fixed `service not registered` exception on Android. ([#17855](https://github.com/expo/expo/pull/17855) by [@lukmccall](https://github.com/lukmccall))
- Fixed `redirectUrl` auth session argument to be optional and thus match documentation. ([#17953](https://github.com/expo/expo/pull/17953) by [@barthap](https://github.com/barthap))
- Fixed `windowFeatures` property not being properly recognized on web. ([#18106](https://github.com/expo/expo/pull/18106) by [@barthap](https://github.com/barthap))

### 💡 Others

- Migrated Expo modules definitions to the new naming convention. ([#17193](https://github.com/expo/expo/pull/17193) by [@tsapeta](https://github.com/tsapeta))
- Rewritten Android code to Kotlin. ([#17195](https://github.com/expo/expo/pull/17195) by [@barthap](https://github.com/barthap))

## 10.2.1 — 2022-05-24

### 🐛 Bug fixes

- On Web fix popup being blocked by Safari. ([#17222](https://github.com/expo/expo/pull/17222) by [@sreuter](https://github.com/sreuter))

## 10.2.0 — 2022-04-18

### 🎉 New features

- Native module on iOS is now written in Swift using the new API. ([#16201](https://github.com/expo/expo/pull/16201) by [@tsapeta](https://github.com/tsapeta))
- Add `presentationStyle` option to customize browser window appearance on iOS. ([#16919](https://github.com/expo/expo/pull/16919) by [@barthap](https://github.com/barthap))
- Add `preferEphemeralSession` option to `openAuthSessionAsync` to ask for a private auth session on iOS. ([#16926](https://github.com/expo/expo/pull/16926) by [@barthap](https://github.com/barthap))

### ⚠️ Notices

- On Android bump `compileSdkVersion` to `31`, `targetSdkVersion` to `31` and `Java` version to `11`. ([#16941](https://github.com/expo/expo/pull/16941) by [@bbarthec](https://github.com/bbarthec))

## 10.1.1 - 2022-02-01

### 🐛 Bug fixes

- Fix `Plugin with id 'maven' not found` build error from Android Gradle 7. ([#16080](https://github.com/expo/expo/pull/16080) by [@kudo](https://github.com/kudo))

## 10.1.0 — 2021-12-03

_This version does not introduce any user-facing changes._

## 10.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 10.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

## 9.3.0 — 2021-09-09

### 🐛 Bug fixes

- Fixed `openAuthSessionAsync` erroneously stating a browser was open when it had failed to open. ([#14181](https://github.com/expo/expo/pull/14181) by [@sumnerwarren](https://github.com/sumnerwarren))

### 💡 Others

- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13757](https://github.com/expo/expo/pull/13757) by [@tsapeta](https://github.com/tsapeta))

## 9.2.0 — 2021-06-16

### 🎉 New features

- Added `createTask` (Android) flag for `WebBrowser`. ([#12462](https://github.com/expo/expo/pull/12462) by [@Ackuq](https://github.com/Ackuq))
- Added custom types definitions for argument and result of `maybeCompleteAuthSession` method. ([#13189](https://github.com/expo/expo/pull/13189) by [@Simek](https://github.com/Simek))

### 🐛 Bug fixes

- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))

## 9.1.0 — 2021-03-10

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 9.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Removed `fbjs` dependency ([#11396](https://github.com/expo/expo/pull/11396) by [@cruzach](https://github.com/cruzach))

## 8.6.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 8.5.0 — 2020-08-18

### 🐛 Bug fixes

- Removed unncecessary Android dependencies. ([#9538](https://github.com/expo/expo/pull/9538) by [@barthap](https://github.com/barthap))
- Fixed `openAuthSessionAsync` crashing when cancelled on iOS. ([#9722](https://github.com/expo/expo/pull/9722) by [@barthap](https://github.com/barthap))

## 8.4.0 — 2020-07-29

### 🎉 New features

- Added `locked` state to `openBrowserAsync`. ([#9254](https://github.com/expo/expo/pull/9254) by [@EvanBacon](https://github.com/EvanBacon))
- Add `secondaryToolbarColor` (Android) flag for `WebBrowser` ([#8615](https://github.com/expo/expo/pull/8615) by [@jdanthinne](https://github.com/jdanthinne)))

### 🐛 Bug fixes

- Fix native Android dependencies used in tests - Kotlin and testing libraries. ([#8881](https://github.com/expo/expo/pull/8881) by [@mczernek](https://github.com/mczernek))

## 8.3.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.3.0 — 2020-05-27

### 🎉 New features

- Add `readerMode` and `dismissButtonStyle` (iOS) and `enableDefaultShare` (Android) flags for `WebBrowser` ([#7221](https://github.com/expo/expo/pull/7221) by [@LinusU](https://github.com/LinusU)) & [@mczernek](https://github.com/mczernek))

### 🐛 Bug fixes

- Fix `WebBrowser` sending `dismiss` before opening. ([#6743](https://github.com/expo/expo/pull/6743) by [@LucaColonnello](https://github.com/LucaColonnello))
