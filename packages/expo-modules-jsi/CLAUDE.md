## Expo Modules JSI

See [README.md](./README.md) for the public overview: what the package is, the layered architecture, the public API surface, Swift/C++ configuration, installation, and distribution. Don't duplicate that material here &mdash; update the README instead.

This file holds context that's only useful when working *inside* the package.

## Directory Structure

```
apple/
├── APINotes/jsi.apinotes          # Controls how JSI C++ types appear in Swift
├── Package.swift                  # SPM package definition
├── ExpoModulesJSI.podspec         # CocoaPods spec
├── scripts/                       # Build scripts (e.g. xcframework packaging)
├── Products/                      # Build output (xcframeworks)
├── Sources/
│   ├── ExpoModulesJSI/            # Main Swift library
│   │   ├── Contexts/              # Bridging contexts for host functions/objects
│   │   ├── Extensions/            # Swift extensions (e.g. Task+immediate)
│   │   ├── Protocols/             # JavaScriptType, JavaScriptRepresentable, etc.
│   │   ├── Runtime/               # JavaScriptRuntime, JavaScriptActor, JavaScriptRef
│   │   │   └── Values/            # JS value wrappers (Value, Object, Array, Function, ArrayBuffer, TypedArray, Promise, BigInt, Error, WeakObject)
│   │   └── Utilities/             # Error handling, DeferredPromise, helpers
│   └── ExpoModulesJSI-Cxx/        # C++ utilities bridging Swift ↔ JSI
│       ├── include/               # C++ headers
│       ├── JSIUtils.cpp
│       └── TypedArray.cpp
├── Tests/                         # Swift Testing suites, one per type
```

C++ headers in `apple/Sources/ExpoModulesJSI-Cxx/include/`: `CppError.h`, `HostFunctionClosure.h`, `HostObject.h`, `HostObjectCallbacks.h`, `JSIUtils.h`, `MemoryBuffer.h`, `NativeState.h`, `RetainedSwiftPointer.h`, `RuntimeScheduler.h`, `TypedArray.h`.

Root-level files (`package.json`, `index.js`, `expo-module.config.json`, etc.) are npm package scaffolding &mdash; the actual implementation is entirely in `apple/`. The npm package has no JS runtime code; `index.js` exports null.

## Build

See README.md for the rationale (Swift/C++ interop is contained inside this package, so consumers link a prebuilt xcframework instead of building from sources). Operational notes:

- `apple/scripts/build-xcframework.sh` is the real build, invoked from the podspec's `script_phase` and run automatically as part of the host app's compilation. It shells out to SPM, hashes inputs to skip no-op rebuilds, and writes additive per-platform slices into `apple/Products/ExpoModulesJSI.xcframework`. Cache lives in `apple/.xcframework-slices/` and `.DerivedData` / `.build` next to the package.
- `apple/scripts/create-stub-xcframework.sh` runs as the podspec's `prepare_command` to materialize an empty xcframework so CocoaPods inserts the copy/embed phases. The primary path for the stub is `ensure_expo_modules_jsi_stub_xcframework` in `expo-modules-autolinking`; `prepare_command` is a fallback because CocoaPods skips it on cache hits.
- Run the script manually with `PODS_ROOT=/path/to/Pods apple/scripts/build-xcframework.sh [--clean]`, or `pnpm build` from the package root. `PLATFORM_NAME` narrows it to a single platform (e.g. `iphonesimulator`).

## Testing

Tests use Swift Testing framework (`import Testing`), not XCTest.

```swift
@Suite
@JavaScriptActor
struct JavaScriptRuntimeTests {
  let runtime = JavaScriptRuntime()

  @Test
  func `create plain object`() {
    _ = runtime.createObject()
  }
}
```

Tests are in `apple/Tests/` and each file covers one type. Some suites use the global actor `@JavaScriptActor` for executor isolation.

Run them with `pnpm test` from the package root, which calls `apple/scripts/test.sh`. The script needs an installed host app's `Pods` directory (defaults to `$EXPO_ROOT_DIR/apps/bare-expo/ios/Pods`); override with `PODS_ROOT`. It symlinks React / hermesvm / ReactNativeDependencies xcframeworks into `apple/.test-frameworks/` so SPM can resolve them as relative-path binary targets, generates the `jsi` modulemap, and runs `xcodebuild test` against an iOS Simulator (override with `DESTINATION`). Extra args pass through to xcodebuild &mdash; e.g. `pnpm test -only-testing TestName`.
