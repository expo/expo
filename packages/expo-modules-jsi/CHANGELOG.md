# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

- [iOS] `JavaScriptNativeState` can now back any `jsi::NativeState` subtype via a `void *` factory, so consumers without Swift/C++ interop (e.g. `expo-modules-core`) can supply their own pointee. `expo::NativeState` ships from the xcframework as a public C++ header. ([#46330](https://github.com/expo/expo/pull/46330) by [@tsapeta](https://github.com/tsapeta))

## 56.0.10 — 2026-06-15

### 🐛 Bug fixes

- [iOS] Ignore already-settled promises. ([#46765](https://github.com/expo/expo/pull/46765) by [@jakex7](https://github.com/jakex7))

## 56.0.9 — 2026-06-10

### 🎉 New features

- [iOS] Add closure-taking `JavaScriptObject.setProperty(_:function:)` overloads that create a sync or async host function from the given closure. ([#46622](https://github.com/expo/expo/pull/46622) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Add `JavaScriptUnownedValue`, a non-owning, non-copyable value that borrows a `jsi::Value` for the zero-copy argument-decode fast path. ([#46616](https://github.com/expo/expo/pull/46616) by [@tsapeta](https://github.com/tsapeta))

## 56.0.8 — 2026-06-05

### 🐛 Bug fixes

- [iOS] Fixed the xcframework build failing with a `sed` error when building in an environment that uses GNU `sed` instead of BSD `sed` (e.g. a Nix shell). ([#46389](https://github.com/expo/expo/pull/46389) by [@niteshbalusu11](https://github.com/niteshbalusu11))
- [iOS] Propagate `JavaScriptPromise` setup failures instead of trapping the app. ([#46106](https://github.com/expo/expo/issues/46106) by [@qutrek](https://github.com/qutrek)) ([#46145](https://github.com/expo/expo/pull/46145) by [@mvincentong](https://github.com/mvincentong))
- Fix build framework for macOS ([#46413](https://github.com/expo/expo/pull/46413) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Fix build framework for Mac Catalyst ([#46289](https://github.com/expo/expo/pull/46289) by [@theeket](https://github.com/theeket))
- [iOS] Throw instead of aborting when `getPropertyAsFunction` targets a missing or non-callable property. ([#46437](https://github.com/expo/expo/pull/46437) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Throw instead of aborting when `getPropertyAsObject` targets a non-object property. ([#46438](https://github.com/expo/expo/pull/46438) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Include the Swift toolchain version in the xcframework cache key so upgrading Xcode rebuilds slices instead of reusing ones built by an older compiler. ([#46523](https://github.com/expo/expo/pull/46523) by [@tsapeta](https://github.com/tsapeta))

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
