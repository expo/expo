# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

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
