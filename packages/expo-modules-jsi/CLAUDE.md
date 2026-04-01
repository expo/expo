## Expo Modules JSI

`expo-modules-jsi` provides type-safe Swift bindings to Facebook's JSI (JavaScript Interface) C++ library. It enables native Swift code to interact with JavaScript runtimes (Hermes) through a Swift-first API. Part of the Expo modules ecosystem.

## Architecture

Three-layer design bridging JSI C++ to Swift:

1. **Swift Layer** (`apple/Sources/ExpoModulesJSI/`) — Public API. Type-safe wrappers around JSI concepts: `JavaScriptRuntime`, `JavaScriptValue`, `JavaScriptObject`, `JavaScriptFunction`, `JavaScriptPromise`, etc. All JS value types are **non-copyable** (`~Copyable`) and conform to `JavaScriptType`. Uses `JavaScriptRef<T>` to convert to reference semantics when needed (escaping closures, containers).

2. **C++ Utilities Layer** (`apple/Sources/ExpoModulesJSI-Cxx/`) — Internal C++ helpers that bridge Swift and JSI. Headers in `include/`: `JSIUtils.h`, `HostObject.h`, `HostFunctionClosure.h`, `CppError.h`, `RuntimeScheduler.h`, `TypedArray.h`.

3. **JSI / Hermes** — Binary xcframeworks (`React`, `hermes-engine`, `ReactNativeDependencies`) consumed as SPM binary targets.

### Key Design Patterns

- **`@JavaScriptActor`** — Global actor enforcing JS thread safety at compile time. Uses a synchronous executor (no thread hopping). Code must be scheduled onto the JS thread externally via `runtime.schedule()` or `runtime.execute()`.
- **Non-copyable value types** — All JS wrappers (`JavaScriptValue`, `JavaScriptObject`, etc.) are `~Copyable` to match JSI's ownership semantics. Use `JavaScriptRef<T>` when reference semantics are needed.
- **C++ interop** — Swift/C++ interoperability is enabled via `.interoperabilityMode(.Cxx)` in Package.swift. APINotes (`apple/APINotes/jsi.apinotes`) control how JSI types are treated by the Swift compiler, e.g. as a value or reference type.
- **`JavaScriptRepresentable`** — Protocol for converting Swift types to/from JS values. Has default implementations for primitives, String, Array, Dictionary, Optional.
- **Error bridging** — `capturingCppErrors()` converts C++ exceptions to Swift errors. `CppError` provides thread-safe C++ exception storage.

## Swift & C++ Configuration

- **Swift 6.0** with strict concurrency (`-strict-concurrency=complete`)
- **C++20** standard
- **Platforms:** iOS 16.4+, tvOS 16.4+, macOS 13.4+
- **Library evolution** enabled for binary framework distribution
- Upcoming Swift features: `NonisolatedNonsendingByDefault`, `InferIsolatedConformances`

## Directory Structure

```
apple/
├── APINotes/jsi.apinotes          # Controls how JSI C++ types appear in Swift
├── Package.swift                  # SPM package definition
├── ExpoModulesJSI.podspec         # CocoaPods spec
├── build.sh                       # Builds .xcframework from SPM package
├── Sources/
│   ├── ExpoModulesJSI/            # Main Swift library
│   │   ├── Contexts/              # Bridging contexts for host functions/objects
│   │   ├── Extensions/            # Swift extensions (e.g. Task+immediate)
│   │   ├── Protocols/             # JavaScriptType, JavaScriptRepresentable, etc.
│   │   ├── Runtime/               # JavaScriptRuntime, JavaScriptActor, JavaScriptRef
│   │   │   └── Values/            # JS value wrappers (Object, Array, Function, Promise, etc.)
│   │   └── Utilities/             # Error handling, DeferredPromise, helpers
│   ├── ExpoModulesJSI-Cxx/        # C++ utilities bridging Swift ↔ JSI
│   │   ├── include/               # C++ headers (JSIUtils, HostObject, CppError, etc.)
│   │   └── TypedArray.cpp         # Typed array implementation
│   └── ExpoModulesJSI-RuntimeProvider/  # ObjC++ bridge for runtime provisioning
├── Tests/                         # Swift Testing suites, one per type
```

Root-level files (`package.json`, `index.js`, `expo-module.config.json`, etc.) are npm package scaffolding — the actual implementation is entirely in `apple/`.

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

## Distribution

- **CocoaPods** via `apple/ExpoModulesJSI.podspec` — distributes as a static framework with vendored `ExpoModulesJSI.xcframework`
- **SPM** via `apple/Package.swift`
- The npm package (`expo-modules-jsi`) has no JS runtime code — `index.js` exports null
