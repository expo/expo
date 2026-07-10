# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- [iOS] Add `JavaScriptRef.withValue`, a non-consuming borrow accessor that reads the referenced value without taking it, so a long-lived reference can be read repeatedly. ([#47238](https://github.com/expo/expo/pull/47238) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Add `JavaScriptRuntime.longLivedObjects`, a `LongLivedObjectCollection` that keeps `LongLivedObject`s (such as in-flight promises) alive across asynchronous boundaries and releases any that remain when the runtime is torn down. ([#47511](https://github.com/expo/expo/pull/47511) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- [iOS] Fixed a use-after-free when a `JavaScriptPromise` outlives its runtime (e.g. an async function's promise held by a completion handler that fires after `reloadAsync()`) by having the runtime's `LongLivedObjectCollection` own its JSI values and release them on the JavaScript thread when the wrapper is dropped or at teardown, instead of against a freed runtime. ([#47521](https://github.com/expo/expo/pull/47521) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Preserve the `code` on the JavaScript error when an async function rejects with a `JavaScriptThrowable` (e.g. an `Exception`), instead of stringifying it and dropping the `code`, mirroring the synchronous throw path. ([#47259](https://github.com/expo/expo/pull/47259) by [@wwdrew](https://github.com/wwdrew))
- [iOS] Fixed a standalone `JavaScriptRuntime` leaking its underlying Hermes runtime: a runtime it creates itself is now destroyed on `deinit`, while runtimes adopted from elsewhere (e.g. React Native) are left untouched. ([#47515](https://github.com/expo/expo/pull/47515) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

## 57.0.1 — 2026-07-07

### 🐛 Bug fixes

- [iOS] Return `NSNull` instead of trapping in the deprecated `JavaScriptValue.getAny()` when it encounters a unrepresentable value. ([#47381](https://github.com/expo/expo/pull/47381) by [@alanjhughes](https://github.com/alanjhughes))

## 57.0.0 — 2026-06-25

### 🛠 Breaking changes

- [iOS] `JavaScriptError` is now a copyable class conforming to `Error` (was a non-copyable struct), and `JavaScriptValue` no longer conforms to `Error`. ([#47154](https://github.com/expo/expo/pull/47154) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- [iOS] `JavaScriptError` can now wrap and throw an arbitrary JS value (not only an `Error` instance) via `init(_:value:)`, preserving the thrown value's identity when it reaches JavaScript. ([#47154](https://github.com/expo/expo/pull/47154) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Add `createFunction`/`setProperty` overloads taking a `UnownedThisSyncFunctionClosure`, which receives `this` as a borrowed `JavaScriptUnownedValue` instead of an owning `JavaScriptValue`. Used by host functions that ignore `this` to skip the per-call owning-value allocation and its `weak`-runtime traffic. ([#46949](https://github.com/expo/expo/pull/46949) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Conform `JavaScriptRuntime` to `Identifiable` with an `id` based on the underlying runtime, equal across multiple wrappers of the same runtime. ([#47068](https://github.com/expo/expo/pull/47068) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- [iOS] Awaiting a `JavaScriptPromise` that is rejected after the await begins now throws instead of resuming with the rejection value as if fulfilled. ([#47154](https://github.com/expo/expo/pull/47154) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- [iOS] Sync host functions no longer allocate a `JavaScriptRef` per call: the arguments buffer is now built inside the synchronous `assumeIsolated` closure instead of being boxed to cross the closure boundary, removing a heap allocation and its retain/release/dealloc from every host call (measured ~10% faster on the no-op `@JS` host-call floor). ([#46949](https://github.com/expo/expo/pull/46949) by [@tsapeta](https://github.com/tsapeta))
- [iOS] `JavaScriptNativeState` can now back any `jsi::NativeState` subtype via a `void *` factory, so consumers without Swift/C++ interop (e.g. `expo-modules-core`) can supply their own pointee. `expo::NativeState` ships from the xcframework as a public C++ header. ([#46330](https://github.com/expo/expo/pull/46330) by [@tsapeta](https://github.com/tsapeta))
- `NativeArrayBuffer` arguments no longer copy the buffer when it's already native-backed. ([#46448](https://github.com/expo/expo/pull/46448) by [@barthap](https://github.com/barthap))
- [iOS] Type the host-object setter pointer explicitly so the nil-check conversion type-checks reliably. ([#46736](https://github.com/expo/expo/pull/46736) by [@tsapeta](https://github.com/tsapeta))
- [iOS] `JavaScriptUnownedValue` and `JavaScriptValuesBuffer` now cache the runtime as the immortal `facebook.jsi.IRuntime` instead of the ARC-managed `JavaScriptRuntime` wrapper, removing per-call retain/release on the argument-decode hot path (measured ~16% faster `addNumbers`, ~24% faster `addStrings`). ([#46792](https://github.com/expo/expo/pull/46792) by [@tsapeta](https://github.com/tsapeta))
- [iOS] `getExpoNativeState` now probes with the specialized `hasNativeState<jsi::NativeState>` and dynamic-casts the raw pointer once, avoiding a redundant `dynamic_pointer_cast` on the shared object argument unwrap hot path. ([#46712](https://github.com/expo/expo/pull/46712) by [@tsapeta](https://github.com/tsapeta))

## 56.0.10 — 2026-06-15

### 🐛 Bug fixes

- [iOS] Ignore already-settled promises. ([#46765](https://github.com/expo/expo/pull/46765) by [@jakex7](https://github.com/jakex7))

## 56.0.9 — 2026-06-10

### 🎉 New features

- [iOS] Add closure-taking `JavaScriptObject.setProperty(_:function:)` overloads that create a sync or async host function from the given closure. ([#46622](https://github.com/expo/expo/pull/46622) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Add `JavaScriptUnownedValue`, a non-owning, non-copyable value that borrows a `jsi::Value` for the zero-copy argument-decode fast path. ([#46616](https://github.com/expo/expo/pull/46616) by [@tsapeta](https://github.com/tsapeta))

## 56.0.8 — 2026-06-05

### 🐛 Bug fixes

- [iOS] Fixed `Build ExpoModulesJSI xcframework` build phase failing on Xcode 26 because the nested SwiftPM build ignored `-derivedDataPath` and wrote products outside the expected location. ([#46326](https://github.com/expo/expo/issues/46326) by [@Kurogoma4D](https://github.com/Kurogoma4D))
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
