# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- [iOS] Propagate deferred `JavaScriptPromise` construction failures instead of trapping the app. ([#46106](https://github.com/expo/expo/issues/46106) by [@qutrek](https://github.com/qutrek)) ([#46145](https://github.com/expo/expo/pull/46145) by [@mvincentong](https://github.com/mvincentong))

### 💡 Others

## 56.0.7 — 2026-05-20

### 🐛 Bug fixes

- [iOS] Implement converters for `JavaScriptRepresentable` to prevent crashes on iOS 17 and 16. ([#45950](https://github.com/expo/expo/pull/45950) by [@behenate](https://github.com/behenate))

### 💡 Others

## 56.0.6 — 2026-05-19

### 🐛 Bug fixes

- [iOS] Fixed `no such module 'jsi'` build error when the package path contains `=` (pnpm virtual store with patched dependencies). ([#45956](https://github.com/expo/expo/pull/45956) by [@tsapeta](https://github.com/tsapeta))

## 56.0.5 — 2026-05-15

_This version does not introduce any user-facing changes._

## 56.0.4 — 2026-05-13

### 🐛 Bug fixes

- [iOS] Fixed xcframework build cache not invalidating when React-jsi headers change. ([#45735](https://github.com/expo/expo/pull/45735) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Added support for `facebook::jsi::IRuntime` so the package builds against React Native 0.86+, while staying compatible with 0.85 and react-native-tvos. ([#45728](https://github.com/expo/expo/pull/45728) by [@zoontek](https://github.com/zoontek))

## 56.0.3 — 2026-05-11

### 🐛 Bug fixes

- [iOS] Fixed launch-time crash in apps with source-built React Native. ([#45636](https://github.com/expo/expo/pull/45636) by [@tsapeta](https://github.com/tsapeta))

## 56.0.2 — 2026-05-08

### 🐛 Bug fixes

- [iOS] Fixed `ExpoModulesJSI.xcframework` build failing under `useFrameworks: "static"` + `buildReactNativeFromSource: true` due to missing header search paths. ([#45508](https://github.com/expo/expo/pull/45508) by [@chrfalch](https://github.com/chrfalch))
- [iOS] Fixed missing slices in `ExpoModulesJSI.xcframework` causing `No such module 'ExpoModulesJSI'` build errors. ([#45542](https://github.com/expo/expo/pull/45542) by [@tsapeta](https://github.com/tsapeta))

## 56.0.1 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.0 — 2026-05-05

### 🎉 New features

- [iOS] Added `JavaScriptValuesBuffer.copying(in:values:)` and `rawBaseAddress` for forwarding pre-converted JS values across the Swift/ObjC++ boundary. ([#45257](https://github.com/expo/expo/pull/45257) by [@alanjhughes](https://github.com/alanjhughes))

### 🐛 Bug fixes

- [iOS] Added prebuild configuration for `ExpoModulesJSI` to be built with precompiled XCFrameworks. ([#45124](https://github.com/expo/expo/pull/45124) by [@chrfalch](https://github.com/chrfalch))
