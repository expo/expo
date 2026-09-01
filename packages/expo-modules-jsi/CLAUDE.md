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
│   │   ├── Coding/                # JavaScriptCodable/Decodable/Encodable + stdlib conformances
│   │   ├── Contexts/              # Bridging contexts for host functions/objects
│   │   ├── Extensions/            # Swift extensions (e.g. Task+immediate)
│   │   ├── Protocols/             # JavaScriptType, JavaScriptRepresentable, etc.
│   │   ├── Runtime/               # JavaScriptRuntime, JavaScriptActor, JavaScriptRef
│   │   │   └── Values/            # JS value wrappers (Value, Object, Array, Function, ArrayBuffer, TypedArray, Promise, BigInt, Error, WeakObject)
│   │   └── Utilities/             # Error handling, DeferredPromise, helpers
│   └── ExpoModulesJSI-Cxx/        # C++ utilities bridging Swift ↔ JSI
│       ├── include/               # In-package C++ headers
│       │   └── Public/            # C++ headers shipped from the xcframework
│       ├── JSIUtils.cpp
│       └── TypedArray.cpp
├── Tests/                         # Swift Testing suites, one per type
```

In-package C++ headers (consumed by `ExpoModulesJSI`'s own Swift sources) live in `apple/Sources/ExpoModulesJSI-Cxx/include/`: `CppError.h`, `HostFunctionClosure.h`, `HostObject.h`, `HostObjectCallbacks.h`, `JSIUtils.h`, `MemoryBuffer.h`, `RetainedSwiftPointer.h`, `RuntimeScheduler.h`, `TypedArray.h`.

Headers under `include/Public/` (today just `NativeState.h`) are additionally copied into the xcframework's `Headers/` directory by `build-xcframework.sh` and exposed via a `requires cplusplus` modulemap submodule, so non-interop C++ consumers (e.g. `expo-modules-core`) can include them via `<ExpoModulesJSI/NativeState.h>` and use `__has_include` for graceful fallback on non-Apple platforms.

Root-level files (`package.json`, `index.js`, `expo-module.config.json`, etc.) are npm package scaffolding &mdash; the actual implementation is entirely in `apple/`. The npm package has no JS runtime code; `index.js` exports null.

## Build

See README.md for the rationale (Swift/C++ interop is contained inside this package, so consumers link a prebuilt xcframework instead of building from sources). Operational notes:

- `apple/scripts/build-xcframework.sh` is the real build, invoked from the podspec's `script_phase` and run automatically as part of the host app's compilation. It shells out to SPM, hashes inputs to skip no-op rebuilds, and writes additive per-platform slices into `apple/Products/ExpoModulesJSI.xcframework`. Cache lives in `apple/.xcframework-slices/` and `.DerivedData` / `.build` next to the package.
- `apple/scripts/create-stub-xcframework.sh` runs as the podspec's `prepare_command` to materialize an empty xcframework so CocoaPods inserts the copy/embed phases. The primary path for the stub is `ensure_expo_modules_jsi_stub_xcframework` in `expo-modules-autolinking`; `prepare_command` is a fallback because CocoaPods skips it on cache hits.
- Run the script manually with `PODS_ROOT=/path/to/Pods apple/scripts/build-xcframework.sh [--clean]`, or `pnpm build:xcframework` from the package root. `PLATFORM_NAME` narrows it to a single platform (e.g. `iphonesimulator`).

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

Run them with `pnpm test:integration` from the package root, which calls `apple/scripts/test.sh`. The script needs an installed host app's `Pods` directory (defaults to `$EXPO_ROOT_DIR/apps/bare-expo/ios/Pods`); override with `PODS_ROOT`. It symlinks React / hermesvm / ReactNativeDependencies xcframeworks into `apple/.test-frameworks/` so SPM can resolve them as relative-path binary targets, generates the `jsi` modulemap, and runs `xcodebuild test` against an iOS Simulator (override with `DESTINATION`). Extra args pass through to xcodebuild &mdash; e.g. `pnpm test -only-testing TestName`.

## Benchmarks

Performance benchmarks live in `apple/Benchmarks/` as a separate opt-in test target. Run them with
`pnpm benchmark` from the package root; it reuses the test harness (`apple/scripts/test.sh`, same
Pods requirements as tests) but builds in the Release configuration, which is required for
meaningful numbers. Regular test runs build the target but skip every suite: the suites are gated
on the `EXPO_BENCHMARK` environment variable, which the script forwards to the test runner via
`TEST_RUNNER_EXPO_BENCHMARK=1`.

Benchmarks default to the Mac Catalyst destination (the prebuilt xcframeworks ship catalyst
slices): they run natively on the Mac with no simulator, and measured spreads drop to 1-2% versus
roughly 10-25% on a simulator. Set `DESTINATION` to override, e.g. for a simulator or device run.

Each benchmark prints one line to the xcodebuild log:

```
[benchmark] <name>: median <X> ns/op, min <Y> ns/op (<iterations> iterations, <samples> samples)
```

Every benchmark is a test in the single `JSIBenchmarks` suite (extended across the files), which
is `.serialized` so only one benchmark runs at a time: the `JavaScriptActor` executor runs jobs
synchronously on the calling thread, so parallel suites would disturb each other's measurements.
Each test wraps its content in `benchmarkCase { runtime in ... }`, which creates a fresh runtime
and runs the case in a high-priority task; at the testing library's default priority the scheduler
sometimes places the run on efficiency cores, which produced multi-fold run-to-run swings.

Inside a case, the `benchmark(_:runtime:samples:_:)` helper calibrates the iteration count to
~50ms per sample (two-phase: tenfold growth to get an estimate, then a rescale from the warmup
run), and collects garbage between samples. The body receives the iteration count and must perform
exactly that many operations: loop in Swift for micro benchmarks, or pass the count to a
JavaScript driver function to measure a full JS-to-native round trip (see
`HostFunctionBenchmarks.swift`, which includes an empty-driver-loop baseline to read the other
results against). Expect run-to-run medians to agree within roughly ±10-25% on a workstation;
compare medians, and treat anything within that band as noise.

## Formatting

Swift sources are formatted with swift-format. From the package root, `pnpm swift:format` rewrites files in place and `pnpm swift:lint` checks without modifying; both delegate to the repo-root `scripts/swift-format.sh`, which reads the repo-root `.swift-format` config and only touches tracked `.swift` files. CI enforces this via `.github/workflows/swift-format.yml`, which pins a specific swift-format version &mdash; mismatched local versions can produce different output, so prefer the pinned one. Style conventions beyond what the formatter enforces live in [`guides/Swift Style Guide.md`](../../guides/Swift%20Style%20Guide.md) at the repo root.
