# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 56.0.5 — 2026-05-08

_This version does not introduce any user-facing changes._

## 56.0.4 — 2026-05-07

### 🐛 Bug fixes

- Adjust CLI Android/iOS library file discovery to remove symlink following ([#44280](https://github.com/expo/expo/pull/44280) by [@kitten](https://github.com/kitten))

## 56.0.3 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.2 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.1 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.0 — 2026-05-05

### 🛠 Breaking changes

- Bumped minimum iOS/tvOS version to 16.4, macOS to 13.4. ([#43296](https://github.com/expo/expo/pull/43296) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- Expose a typed config plugin function ([#44098](https://github.com/expo/expo/pull/44098) by [@zoontek](https://github.com/zoontek))
- [ios] enable optional usage of prebuilt RN frameworks ([#43356](https://github.com/expo/expo/pull/43356) by [@pmleczek](https://github.com/pmleczek))
- align using custom components between the platforms ([#43633](https://github.com/expo/expo/pull/43633) by [@pmleczek](https://github.com/pmleczek))
- [state] shared state implementation improvements ([#43279](https://github.com/expo/expo/pull/43279) by [@pmleczek](https://github.com/pmleczek))
- Use react-native prebuilds by default ([#44332](https://github.com/expo/expo/pull/44332) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- [iOS] Support rendering multiple ReactNativeView simultaneously ([#44891](https://github.com/expo/expo/pull/44891) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Support registering custom turbo modules from the hosting app ([#44929](https://github.com/expo/expo/pull/44929) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- [iOS] Add support for iOS prebuilds. ([#45148](https://github.com/expo/expo/pull/45148) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- [iOS] Add support for using multiple inner app frameworks in one host app via the new `multipleFrameworks` property. ([#45347](https://github.com/expo/expo/pull/45347) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 💡 Others

- [iOS] Use `JavaScriptValue.getAny()` in place of the removed `getRaw()`. ([#44337](https://github.com/expo/expo/pull/44337) by [@tsapeta](https://github.com/tsapeta))
- [test] add maestro e2e tests for dev menu ([#43421](https://github.com/expo/expo/pull/43421) by [@pmleczek](https://github.com/pmleczek))
- [android] set react native version for all published artfacts ([#43693](https://github.com/expo/expo/pull/43693) by [@pmleczek](https://github.com/pmleczek))
- [test] add fixes to ios debug e2es ([#43703](https://github.com/expo/expo/pull/43703) by [@pmleczek](https://github.com/pmleczek))
- Validate package installation before running CLI commands ([#44210](https://github.com/expo/expo/pull/44210) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 55.0.22 - 2026-05-05

_This version does not introduce any user-facing changes._

## 55.0.21 - 2026-04-21

### 🎉 New features

- Added `Expo.plist` to the brownfield framework target. ([#44645](https://github.com/expo/expo/pull/44645) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- [iOS] Add `DEFINE_MODULES=TRUE` build setting ([#44672](https://github.com/expo/expo/pull/44672) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- [ios] Fix loading assets in brownfield. ([#44724](https://github.com/expo/expo/pull/44724) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 55.0.20 - 2026-04-09

_This version does not introduce any user-facing changes._

## 55.0.19 - 2026-04-07

_This version does not introduce any user-facing changes._

## 55.0.18 - 2026-04-02

_This version does not introduce any user-facing changes._

## 55.0.17 - 2026-04-02

_This version does not introduce any user-facing changes._

## 55.0.16 - 2026-03-27

_This version does not introduce any user-facing changes._

## 55.0.15 - 2026-03-17

_This version does not introduce any user-facing changes._

## 55.0.13 - 2026-03-05

### 🛠 Breaking changes

- [ios] rename option from 'usePrebuiltReactNative' to 'buildReactNativeFromSource' ([#43574](https://github.com/expo/expo/pull/43574) by [@pmleczek](https://github.com/pmleczek))

## 55.0.12 - 2026-02-26

### 🎉 New features

- [android] add basic implementation of shared state for android ([#43097](https://github.com/expo/expo/pull/43097) by [@pmleczek](https://github.com/pmleczek))
- [cli] allow shipping ios artifacts as swift package ([#43369](https://github.com/expo/expo/pull/43369) by [@pmleczek](https://github.com/pmleczek))

## 55.0.11 — 2026-02-25

### 💡 Others

- [test] run brownfield e2e tests (cli + plugin) in sdk/check-packages workflow ([#43391](https://github.com/expo/expo/pull/43391) by [@pmleczek](https://github.com/pmleczek))

## 55.0.10 — 2026-02-25

### 🎉 New features

- [android] add basic implementation of shared state for android ([#43097](https://github.com/expo/expo/pull/43097) by [@pmleczek](https://github.com/pmleczek))

### 💡 Others

- [test] setup maestro e2e tests for expo-brownfield on ios ([#43028](https://github.com/expo/expo/pull/43028) by [@pmleczek](https://github.com/pmleczek))
- [state] add ios implementation & improvements ([#43236](https://github.com/expo/expo/pull/43236) by [@pmleczek](https://github.com/pmleczek))

## 55.0.9 — 2026-02-20

### 🐛 Bug fixes

- [Android] improve security of env injection in publishing in [#43059](https://github.com/expo/expo/pull/43059) by [@pmleczek](https://github.com/pmleczek)
- [ios] pass additional settings to generate CFBundleShortVersionString ([#43289](https://github.com/expo/expo/pull/43289) by [@pmleczek](https://github.com/pmleczek))

## 55.0.8 — 2026-02-16

### 🛠 Breaking changes

- [cli] update copied hermes framework name to hermesvm.xcframework ([#43138](https://github.com/expo/expo/pull/43138) by [@pmleczek](https://github.com/pmleczek))

### 🐛 Bug fixes

- [iOS] fix framework search paths settings ([#43106](https://github.com/expo/expo/pull/43106) by [@pmleczek](https://github.com/pmleczek))

### 💡 Others

- [test] add compilation verification and optimize brownfield workflow in [#42894](https://github.com/expo/expo/pull/42894) by [@pmleczek](https://github.com/pmleczek)
- [cli] cli refactor ([#42921](https://github.com/expo/expo/pull/42921) by [@pmleczek](https://github.com/pmleczek))

## 55.0.7 — 2026-02-08

### 🐛 Bug fixes

- [Android] fix dev menu in isolated brownfield ([#42637](https://github.com/expo/expo/pull/42637) by [@pmleczek](https://github.com/pmleczek))
- [cli] handle build:android called with no args ([#42914](https://github.com/expo/expo/pull/42914) by [@pmleczek](https://github.com/pmleczek))

### 💡 Others

- [test] setup maestro e2e tests for expo-brownfield on android in [#42864](https://github.com/expo/expo/pull/42864) by [@pmleczek](https://github.com/pmleczek)

## 55.0.6 — 2026-02-03

_This version does not introduce any user-facing changes._

## 55.0.5 — 2026-02-03

### 🐛 Bug fixes

- [Android] strip com.facebook.react:hermes-android in [#42769](https://github.com/expo/expo/pull/42769) by [@pmleczek](https://github.com/pmleczek)
- [iOS] Brownfield fixes & improvements for iOS in [#42782](https://github.com/expo/expo/pull/42782) by [@pmleczek](https://github.com/pmleczek)

### 💡 Others

- [test] Added E2E tests and improvements for CLI in [#42120](https://github.com/expo/expo/pull/42120) by [@pmleczek](https://github.com/pmleczek)
- [test] Added E2E tests for the config plugin in [#42374](https://github.com/expo/expo/pull/42374) by [@pmleczek](https://github.com/pmleczek)

## 55.0.4 — 2026-01-27

_This version does not introduce any user-facing changes._

## 55.0.3 — 2026-01-26

### 💡 Others

- Add script to resolve symlinks ([#42457](https://github.com/expo/expo/pull/42457) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 55.0.2 — 2026-01-22

### 💡 Others

- [iOS] Use internal import for Expo ([#42449](https://github.com/expo/expo/pull/42449) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 55.0.1 — 2026-01-22

_This version does not introduce any user-facing changes._

## 55.0.0 — 2026-01-21

### 🐛 Bug fixes

- [iOS] Added support for React Native 0.83 in [#42038](https://github.com/expo/expo/pull/42038) by [@gabrieldonadel](https://github.com/gabrieldonadel)
- [iOS] Refactor podspec and fix template ([#42105](https://github.com/expo/expo/pull/42105) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- [android] Added support for react-native 0.83 ([#42069](https://github.com/expo/expo/pull/42069) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Add `bin/cli.js` entrypoint for CLI ([#42152](https://github.com/expo/expo/pull/42152) by [@kitten](https://github.com/kitten))
- Fixed debug compilation for Android in [#42234](https://github.com/expo/expo/pull/42234) by [@pmleczek](https://github.com/pmleczek)
- Remove leftover phase reordering script setup from the config plugin in [#42427](https://github.com/expo/expo/pull/42427) by [@pmleczek](https://github.com/pmleczek)

### 💡 Others

- Initialized the package for `expo-brownfield` with code from [expo-brownfield-target](https://github.com/software-mansion-labs/expo-brownfield-target) in [#42012](https://github.com/expo/expo/pull/42012) by [@pmleczek](https://github.com/pmleczek), [@gabrieldonadel](https://github.com/gabrieldonadel)
- Updated `minimal-tester` to use `expo-brownfield` (includes 2 minor iOS improvments in the package) in [#42048](https://github.com/expo/expo/pull/42048) by [@gabrieldonadel](https://github.com/gabrieldonadel)
- Updated build configurations and resolved leftover TODOs in [#42072](https://github.com/expo/expo/pull/42072) by [@pmleczek](https://github.com/pmleczek)
- [iOS] Symlink ExpoAppDelegate to iOS template ([#42240](https://github.com/expo/expo/pull/42240) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- [iOS] Remove ExpoModulesProvider patch ([#42317](https://github.com/expo/expo/pull/42317) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Improved bundle loading failure handling in [#42469](https://github.com/expo/expo/pull/42469) by [@pmleczek](https://github.com/pmleczek)
- Added `expo-dev-client` warning message in [#42564](https://github.com/expo/expo/pull/42564) by [@pmleczek](https://github.com/pmleczek)
- Pass manifest from bundler to dev menu in isolated brownfield ([#42600](https://github.com/expo/expo/pull/42600) by [@pmleczek](https://github.com/pmleczek))
