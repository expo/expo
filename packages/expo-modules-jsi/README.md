<p>
  <a href="https://docs.expo.dev/modules/">
    <img
      src="../../.github/resources/expo-modules-core.svg"
      alt="expo-modules-jsi"
      height="64" />
  </a>
</p>

`expo-modules-jsi` provides type-safe Swift bindings to React Native's JSI (JavaScript Interface) C++ library. It lets native Swift code interact with the JavaScript runtime (Hermes) through a Swift-first API and is the foundation that newer parts of `expo-modules-core` build on.

This package has no JavaScript runtime code &mdash; it is consumed natively on iOS via CocoaPods or Swift Package Manager. The npm package only exists so the native sources can be autolinked into your app.

# Architecture

Three-layer design bridging JSI C++ to Swift:

1. **Swift Layer** (`apple/Sources/ExpoModulesJSI/`) &mdash; Public API. Type-safe wrappers around JSI concepts: `JavaScriptRuntime`, `JavaScriptValue`, `JavaScriptObject`, `JavaScriptFunction`, etc. All JS value types are non-copyable (`~Copyable`) and conform to `JavaScriptType`. Use `JavaScriptRef<T>` to convert to reference semantics when needed (escaping closures, containers).
2. **C++ Utilities Layer** (`apple/Sources/ExpoModulesJSI-Cxx/`) &mdash; Internal C++ helpers that bridge Swift and JSI.
3. **JSI / Hermes** &mdash; Binary xcframeworks (`React`, `hermes-engine`, `ReactNativeDependencies`) consumed as SPM binary targets.

# Public API

- `JavaScriptRuntime` &mdash; entry point for evaluating scripts, scheduling work on the JS thread, and creating values.
- `JavaScriptValue`, `JavaScriptObject`, `JavaScriptArray`, `JavaScriptFunction`, `JavaScriptArrayBuffer`, `JavaScriptTypedArray`, `JavaScriptPromise`, `JavaScriptBigInt`, `JavaScriptError`, `JavaScriptWeakObject` &mdash; non-copyable (`~Copyable`) wrappers around their JSI counterparts.
- `JavaScriptRef<T>` &mdash; turns any of the above into a reference type for use in escaping closures and containers.
- `JavaScriptRepresentable` &mdash; protocol for converting Swift types to and from JS values, with default implementations for primitives, `String`, `Array`, `Dictionary`, and `Optional`.
- `@JavaScriptActor` &mdash; global actor that enforces JS-thread isolation at compile time. The executor is synchronous (no thread hopping); code must be scheduled onto the JS thread externally via `runtime.schedule()` or `runtime.execute()`.
- Error bridging &mdash; `capturingCppErrors()` converts C++ exceptions into Swift errors; `CppError` provides thread-safe C++ exception storage.

C++ interoperability is enabled with `.interoperabilityMode(.Cxx)`, and `apple/APINotes/jsi.apinotes` controls how individual JSI types surface in Swift.

# Swift & C++ Configuration

- **Swift 6.0** with strict concurrency (`-strict-concurrency=complete`)
- **C++20** standard
- **Platforms:** iOS 16.4+, tvOS 16.4+, macOS 13.4+
- **Library evolution** enabled for binary framework distribution
- Upcoming Swift features: `NonisolatedNonsendingByDefault`, `InferIsolatedConformances`

# Installation

This package is not meant to be installed directly. It ships as a transitive native dependency of [`expo-modules-core`](../expo-modules-core), which is included in any Expo project. Adding it to your app's `package.json` is unnecessary and unsupported.

# Distribution

- **CocoaPods** via `apple/ExpoModulesJSI.podspec` &mdash; distributed as a static framework with a vendored `ExpoModulesJSI.xcframework`.
- **Swift Package Manager** via `apple/Package.swift`.

# Building

The package can't be consumed from sources directly: it relies on Swift/C++ interop, which is a per-target compiler setting. Source distribution would force every Expo module that depends on it &mdash; and transitively the host app &mdash; to enable Swift/C++ interop too, which is invasive and significantly increases build times for each module. Instead, the sources are compiled into a binary `ExpoModulesJSI.xcframework` that consumers link against, so Swift/C++ interop stays contained inside this package.

The build is wired up in `apple/ExpoModulesJSI.podspec`:

- A `script_phase` runs `apple/scripts/build-xcframework.sh` before headers on every build of the host app. The script invokes SPM under the hood, applies hash-based caching to skip rebuilds when sources haven't changed, and produces additive per-platform slices in `apple/Products/ExpoModulesJSI.xcframework`.
- A `prepare_command` runs `apple/scripts/create-stub-xcframework.sh` so CocoaPods generates the "Copy XCFrameworks" and "Embed Pods Frameworks" build phases even before the real xcframework exists.
- The xcframework is declared as `vendored_frameworks`, so dependents see it as a regular binary dependency with no interop flags of their own.

You can also build and test the package directly:

```sh
pnpm build   # rebuild the xcframework outside of a Pods install
pnpm test    # run the Swift Testing suite on an iOS Simulator
```

`pnpm test` runs against an installed host app's `Pods` directory (defaults to `apps/bare-expo`); set `PODS_ROOT` to point at a different one. Extra arguments are forwarded to `xcodebuild` (e.g. `pnpm test -only-testing TestName`).

# Using JSI types from a module

Module authors don't import `ExpoModulesJSI` directly &mdash; `expo-modules-core` re-exports its types, so `import ExpoModulesCore` is enough. The Expo Modules API marshals JSI values automatically when you declare them in a `ModuleDefinition`:

```swift
import ExpoModulesCore

public class MyModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MyModule")

    Function("printString") { (value: JavaScriptValue) in
      print(value.getString())
    }
  }
}
```

For lower-level access, reach the runtime through the module's `appContext`. Schedule work onto the JS thread to call into JSI safely:

```swift
AsyncFunction("evaluate") {
  try appContext?.runtime.schedule(priority: .immediate) {
    let result = try appContext?.runtime.eval("1 + 2")
    print(result?.getInt() ?? 0)
  }
}
```

# Contributing

Contributions are very welcome! Please refer to the guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
