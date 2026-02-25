# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

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
