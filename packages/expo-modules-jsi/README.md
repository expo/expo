<p>
  <a href="https://docs.expo.dev/modules/">
    <img
      src="../../.github/resources/expo-modules-jsi.svg"
      alt="expo-modules-jsi"
      height="64" />
  </a>
</p>

`expo-modules-jsi` provides type-safe Swift bindings to React Native's JSI (JavaScript Interface) C++ library. It lets native Swift code interact with the JavaScript runtime (Hermes) through a Swift-first API and is the foundation that newer parts of [`expo-modules-core`](../expo-modules-core) build on.

This package has no JavaScript runtime code. It is consumed natively on Apple platforms via CocoaPods or Swift Package Manager, and the npm package only exists so the native sources can be autolinked into your app.

# Installation

This package is not meant to be installed directly. It ships as a transitive native dependency of [`expo-modules-core`](../expo-modules-core), which is included in any Expo project. Adding it to your app's `package.json` is unnecessary and unsupported.

# Public API

- `JavaScriptRuntime`: entry point for evaluating scripts, scheduling work on the JS thread, and creating values.
- `JavaScriptValue`, `JavaScriptObject`, `JavaScriptArray`, `JavaScriptFunction`, `JavaScriptArrayBuffer`, `JavaScriptTypedArray`, `JavaScriptPromise`, `JavaScriptBigInt`, `JavaScriptError`, `JavaScriptWeakObject`: non-copyable (`~Copyable`) wrappers around their JSI counterparts.
- `JavaScriptRef<T>`: turns any of the above into a reference type for use in escaping closures and containers.
- `JavaScriptRepresentable`: protocol for converting Swift types to and from JS values, with default implementations for primitives, `String`, `Array`, `Dictionary` and `Optional`.
- `JavaScriptDecodable`, `JavaScriptEncodable` and their `JavaScriptCodable` composition: coding layer with conformances for stdlib types, `Data`, `Date` and `Task`.
- `@JavaScriptActor`: global actor that enforces JS-thread isolation at compile time. Its executor is synchronous (no thread hopping), so code must be placed on the JS thread externally, with `runtime.schedule()` or `runtime.execute()`.
- Error bridging: `capturingCppErrors()` converts C++ exceptions into Swift errors, and `CppError` provides thread-safe C++ exception storage.

# Swift and C++ configuration

- **Swift 6** language mode (`swiftLanguageModes: [.v6]`), which implies complete concurrency checking
- **C++20** standard
- **Platforms:** iOS 16.4+, tvOS 16.4+, macOS 13.4+
- **Library evolution** enabled for binary framework distribution
- Upcoming Swift features: `NonisolatedNonsendingByDefault`, `InferIsolatedConformances`

C++ interoperability is enabled with `.interoperabilityMode(.Cxx)`, and `apple/APINotes/jsi.apinotes` controls how individual JSI types surface in Swift.

# Building

The package can't be consumed from sources directly: it relies on Swift/C++ interop, which is a per-target compiler setting. Source distribution would force every Expo module that depends on it, and transitively the host app, to enable Swift/C++ interop too, which is invasive and significantly increases build times for each module. Instead, the sources are compiled into a binary `ExpoModulesJSI.xcframework` that consumers link against, so Swift/C++ interop stays contained inside this package.

The build is wired up in `apple/ExpoModulesJSI.podspec`:

- A `script_phase` runs `apple/scripts/build-xcframework.sh` before headers on every build of the host app. The script invokes SPM under the hood, applies hash-based caching to skip rebuilds when sources haven't changed, and produces additive per-platform slices in `apple/Products/ExpoModulesJSI.xcframework`.
- A `prepare_command` runs `apple/scripts/create-stub-xcframework.sh` so CocoaPods generates the "Copy XCFrameworks" and "Embed Pods Frameworks" build phases even before the real xcframework exists.
- The xcframework is declared as `vendored_frameworks`, so dependents see it as a regular binary dependency with no interop flags of their own.

You can also build the package directly:

```sh
pnpm build:xcframework   # rebuild the xcframework outside of a Pods install
pnpm clean               # remove local build caches and artifacts
```

# Testing

Tests live in `apple/Tests/` and use the Swift Testing framework. Benchmarks live in `apple/Benchmarks/` and are gated on an environment variable, so a regular test run builds but skips them.

```sh
pnpm test:integration    # run the test suite on an iOS Simulator
pnpm benchmark           # run the benchmarks in the Release configuration
```

Both run against an installed host app's `Pods` directory, which defaults to `apps/bare-expo`. Set `PODS_ROOT` to point at a different one and `DESTINATION` to choose another xcodebuild destination. Extra arguments are forwarded to `xcodebuild`, for example `pnpm test:integration -only-testing Tests/JavaScriptValueTests`.

# Using JSI types from a module

Module authors don't import `ExpoModulesJSI` directly. `expo-modules-core` re-exports its types, so `import ExpoModulesCore` is enough. The Expo Modules API marshals JSI values automatically when you declare them in a `ModuleDefinition`:

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

For lower-level access, reach the runtime through the module's `appContext`. Calls into JSI must happen on the JS thread, so wrap them in `execute` (synchronous, returns a value) or `schedule` (asynchronous, fire and forget):

```swift
AsyncFunction("evaluate") { (source: String) -> Int in
  guard let appContext else {
    throw Exceptions.AppContextLost()
  }
  let runtime = try appContext.runtime

  return try runtime.execute {
    try runtime.eval(source).getInt()
  }
}
```

# Contributing

Contributions are very welcome! Please refer to the guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
