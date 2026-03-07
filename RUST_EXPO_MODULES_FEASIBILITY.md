# Feasibility Analysis: First-Class Rust Support in Expo Modules

## Executive Summary

First-class Rust support in Expo Modules is **technically feasible** and is actively under development. Rust modules communicate directly with the JSI C++ runtime via a thin `cxx`-based shim layer — no Kotlin/Swift DSL wrappers, no dependency on the C++ Module API (PR #43580). Module authors write plain Rust functions and a proc macro generates all JSI integration code.

The implementation lives in `packages/expo-rust-jsi/`.

---

## 1. Current Expo Modules Architecture

### 1.1 The Module Definition DSL

Expo modules use a declarative DSL on each platform:

**Kotlin (Android):**
```kotlin
class MyModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MyModule")
    Function("add") { a: Int, b: Int -> a + b }
    AsyncFunction("fetchData") { url: String ->
      // async work
    }
  }
}
```

**Swift (iOS):**
```swift
class MyModule: Module {
  func definition() -> ModuleDefinition {
    Name("MyModule")
    Function("add") { (a: Int, b: Int) -> Int in
      return a + b
    }
    AsyncFunction("fetchData") { (url: String) in
      // async work
    }
  }
}
```

### 1.2 Architecture Layers

The module system has these layers, from JS to native:

```
┌──────────────────────────────────────────────────────────────────┐
│  JavaScript                                                       │
│  requireNativeModule("MyModule") → globalThis.expo.modules.MyModule│
├──────────────────────────────────────────────────────────────────┤
│  JSI Host Object (C++)                                            │
│  ExpoModulesHostObject → LazyObject → per-module jsi::Object     │
├──────────────────────────────────────────────────────────────────┤
│  Platform Bridge                                                  │
│  Android: fbjni (C++ ↔ JVM)  │  iOS: Obj-C++ (.mm) ↔ Swift     │
├──────────────────────────────────────────────────────────────────┤
│  Module DSL Layer                                                 │
│  Android: Kotlin DSL          │  iOS: Swift DSL                  │
│  (ModuleDefinitionBuilder)    │  (@ModuleDefinitionBuilder)      │
├──────────────────────────────────────────────────────────────────┤
│  Native Platform APIs                                             │
│  Android SDK, JNI, NDK        │  UIKit, Foundation, etc.         │
└──────────────────────────────────────────────────────────────────┘
```

### 1.3 Key Files

| Component | Android | iOS |
|-----------|---------|-----|
| Module base class | `expo/modules/kotlin/modules/Module.kt` | `ios/Core/Modules/Module.swift` |
| Definition builder | `expo/modules/kotlin/modules/ModuleDefinitionBuilder.kt` | `ios/Core/Modules/ModuleDefinition.swift` |
| Object builder (Function/AsyncFunction) | `expo/modules/kotlin/objects/ObjectDefinitionBuilder.kt` | `ios/Core/Objects/ObjectDefinition.swift` |
| JSI bridge (C++) | `android/src/main/cpp/JavaScriptModuleObject.cpp` | `ios/JS/ExpoModulesHostObject.mm` |
| Host object | `android/src/main/cpp/ExpoModulesHostObject.cpp` | `ios/JS/ExpoModulesHostObject.mm` |
| Module discovery | `expo-modules-autolinking/` | `ios/Core/ModulesProvider.swift` |
| JS entry point | `src/requireNativeModule.ts` | same |

### 1.4 How Modules Are Discovered and Loaded

1. **Autolinking**: `expo-modules-autolinking` reads `expo-module.config.json` from each package
2. **Code generation**: On Android, generates a Kotlin class listing module classes. On iOS, generates a Swift `ModulesProvider` subclass
3. **Registration**: At runtime, the generated provider instantiates each module class
4. **JSI installation**: `ExpoModulesHostObject` is installed as `globalThis.expo.modules`
5. **Lazy loading**: When JS accesses `expo.modules.MyModule`, the host object lazily creates the JSI object from the module's definition

---

## 2. Design: Rust ↔ JSI Direct via `cxx` Shim

### 2.1 Data Flow

Rust modules talk directly to the JSI runtime through a thin C++ shim bridged by the `cxx` crate. There is no dependency on the Kotlin/Swift DSL or the C++ Module API (PR #43580).

```
JS (Hermes) → JSI (C++) → jsi_shim.cpp (cxx bridge) → Rust module
                ↑                                          │
                └──────────────────────────────────────────┘
```

### 2.2 Why Not PR #43580

PR #43580 introduces a `CppModule` base class and C++ DSL for defining modules. Our design **does not depend on it** because:

1. We bypass `CppModule` entirely — Rust creates raw `jsi::Object` instances via FFI functions (`jsi_create_object`, `jsi_object_set_property`)
2. Module registration is a direct property set on `expo.modules[name]` via `jsi_register_module`, not through any C++ adapter class
3. The bootstrap path uses a standard Kotlin/Swift expo module only to obtain the `jsi::Runtime*` pointer, then hands off to Rust

This means the Rust integration can ship independently, without waiting for the C++ API to land or stabilize.

### 2.3 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  JavaScript                                                      │
│  requireNativeModule("RustMath") → expo.modules.RustMath         │
├─────────────────────────────────────────────────────────────────┤
│  JSI Runtime (C++)                                               │
│  jsi::Object with properties/functions set by Rust               │
├─────────────────────────────────────────────────────────────────┤
│  jsi_shim.cpp (cxx bridge)                                       │
│  FfiValue, HandleTable, jsi_create_object, jsi_register_module   │
│  RustHostObject (jsi::HostObject backed by Rust callbacks)       │
├─────────────────────────────────────────────────────────────────┤
│  Rust (expo-rust-jsi crate)                                      │
│  ExpoModule trait, ModuleBuilder, #[expo_module] proc macro      │
│  FromJsValue / IntoJsValue type conversion                       │
├─────────────────────────────────────────────────────────────────┤
│  Bootstrap (thin Kotlin/Swift module)                            │
│  Loads native library, passes jsi::Runtime* to Rust              │
│  ExpoRustJsiModule.kt / ExpoRustJsiModule.swift                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 Component Overview

| Component | Location | Purpose |
|-----------|----------|---------|
| `jsi_shim.h/.cpp` | `cpp/` | C++ side of the `cxx` bridge. Creates/manipulates JSI values, objects, arrays. Implements `RustHostObject` (a `jsi::HostObject` backed by Rust callbacks). Manages `HandleTable` for tracking JSI object lifetimes across FFI. |
| `bridge.rs` | `src/` | Rust side of the `cxx` bridge. Declares `FfiValue`, `RuntimeHandle`, and all FFI function signatures. |
| `module.rs` | `src/` | `ExpoModule` trait, `ModuleBuilder` (fluent API), `ModuleRegistry` (collects and installs modules). |
| `value.rs` | `src/` | `JsValue` enum, `FromJsValue`/`IntoJsValue` traits with impls for primitives, `Option<T>`, `Vec<T>`, etc. |
| `expo-module-macro/` | proc macro crate | `#[expo_module("Name")]` attribute macro that generates `ExpoModule` impl from a plain `impl` block. |
| callback registry | `src/bridge.rs` | `Mutex<HashMap<u64, Box<dyn Fn>>>` mapping callback IDs to Rust closures. `register_callback()` stores a closure and returns an ID; `rust_invoke_host_fn()` (extern "Rust") looks up and invokes the closure when C++ calls back. |
| `ExpoRustJsiModule.kt` | `android/` | Kotlin bootstrap: loads native lib, calls `nativeInstall(jsiRuntimePtr)`. |
| `ExpoRustJsiModule.swift` | `ios/` | Swift bootstrap: calls `expo_rust_jsi_install(runtimePtr)`. |

---

## 3. The `#[expo_module]` Proc Macro

The macro transforms idiomatic Rust into the builder pattern automatically:

```rust
use expo_rust_jsi::prelude::*;

struct MathModule;

#[expo_module("RustMath")]
impl MathModule {
    #[constant]
    const PI: f64 = std::f64::consts::PI;

    #[constant]
    const E: f64 = std::f64::consts::E;

    fn add(a: f64, b: f64) -> f64 {
        a + b
    }

    fn sqrt(x: f64) -> f64 {
        x.sqrt()
    }

    fn fibonacci(n: i32) -> f64 {
        let mut a: i64 = 0;
        let mut b: i64 = 1;
        for _ in 2..=n {
            let tmp = a + b;
            a = b;
            b = tmp;
        }
        b as f64
    }
}
```

This expands to:

```rust
impl MathModule {
    const PI: f64 = std::f64::consts::PI;
    const E: f64 = std::f64::consts::E;
    fn add(a: f64, b: f64) -> f64 { a + b }
    fn sqrt(x: f64) -> f64 { x.sqrt() }
    fn fibonacci(n: i32) -> f64 { /* ... */ }
}

impl ExpoModule for MathModule {
    fn definition() -> ModuleDefinition {
        ModuleBuilder::new("RustMath")
            .constant("PI", std::f64::consts::PI)
            .constant("E", std::f64::consts::E)
            .sync_fn_2::<f64, f64, f64, _>("add", |a, b| MathModule::add(a, b))
            .sync_fn_1::<f64, f64, _>("sqrt", |x| MathModule::sqrt(x))
            .sync_fn_1::<i32, f64, _>("fibonacci", |n| MathModule::fibonacci(n))
            .build()
    }
}
```

**Key features:**
- Function arity (0-4 params) and types are inferred from the Rust signature
- `#[constant]` works on both `const` items and zero-arg methods
- `#[async_fn]` marks methods for async JS function registration
- Methods remain callable as `MathModule::add(1.0, 2.0)` from Rust
- `&self` is rejected at compile time — module functions must be static

---

## 4. The `cxx` Bridge Layer

### 4.1 FFI Value Type

All values crossing the Rust/C++ boundary use `FfiValue`:

```rust
// Rust side (bridge.rs)
struct FfiValue {
    kind: ValueKind,    // Undefined | Null | Boolean | Number | String | Object | Array
    bool_val: bool,
    number_val: f64,
    string_val: String,
    handle: u64,        // opaque handle for objects/arrays
}
```

Primitives are stored inline. Objects and arrays are stored in a `HandleTable` (C++ side) and referenced by opaque `u64` handle. This avoids passing C++ pointers through Rust while keeping JSI object lifetimes managed.

### 4.2 FFI Functions (C++ callable from Rust)

```
jsi_make_undefined()              → FfiValue
jsi_make_null()                   → FfiValue
jsi_make_bool(val)                → FfiValue
jsi_make_number(val)              → FfiValue
jsi_make_string(val)              → FfiValue
jsi_create_object(rt)             → FfiValue (with handle)
jsi_object_set_property(rt, h, name, val)
jsi_object_get_property(rt, h, name) → FfiValue
jsi_create_array(rt, len)         → FfiValue (with handle)
jsi_array_set_value(rt, h, idx, val)
jsi_array_get_value(rt, h, idx)   → FfiValue
jsi_array_length(rt, h)           → u32
jsi_register_module(rt, name, h)  → installs into expo.modules[name]
jsi_create_host_function(rt, name, param_count, callback_id) → FfiValue (fn handle)
jsi_object_set_host_function(rt, obj_h, name, fn_h)
jsi_throw_error(rt, message)      → throws C++ JSError exception
```

**Rust → C++ callback (extern "Rust"):**
```
rust_invoke_host_fn(callback_id, rt, args: &[FfiValue]) → FfiValue
```
Called by `jsi_create_host_function`'s lambda when JS invokes a Rust-backed function.

### 4.3 RustHostObject

For modules that need dynamic property access, `RustHostObject` implements `jsi::HostObject` and delegates `get`/`set`/`getPropertyNames` to Rust function pointers:

```cpp
class RustHostObject : public jsi::HostObject {
    void* rust_ctx_;
    RustPropertyGetter getter_;   // FfiValue(*)(void*, rust::Str)
    RustPropertySetter setter_;   // void(*)(void*, rust::Str, const FfiValue&)
    std::vector<std::string> property_names_;
};
```

### 4.4 HandleTable

A singleton that maps `uint64_t` handles to `shared_ptr<void>`, protected by a mutex. This is how JSI objects (which are C++ move-only types) are safely tracked across the FFI boundary:

```
Rust: "create object" → C++: creates jsi::Object, stores in HandleTable → returns handle u64
Rust: "set property on handle X" → C++: looks up handle X, calls obj.setProperty()
Rust: "register module with handle X" → C++: looks up handle X, sets on expo.modules
```

---

## 5. Type Conversion: JSI ↔ Rust

### 5.1 Primitive Types

| JavaScript | JSI C++ | Rust |
|------------|---------|------|
| `number` | `double` | `f64` / `i32` / `i64` / `u32` |
| `string` | `jsi::String` | `String` |
| `boolean` | `bool` | `bool` |
| `null` | `jsi::Value::null()` | `Option<T>::None` |
| `undefined` | `jsi::Value::undefined()` | `()` |
| `ArrayBuffer` | `jsi::ArrayBuffer` | `Vec<u8>` / `&[u8]` |

### 5.2 Complex Types

| JavaScript | Rust |
|------------|------|
| `Object` | `HashMap<String, Value>` or custom struct with `#[derive(FromJsValue)]` |
| `Array` | `Vec<T>` |
| `Promise` | `Future<Output = Result<T, E>>` |
| `TypedArray` | `Vec<T>` with element type |
| `Record` | Struct with `#[derive(FromJsValue)]` |
| `Enum` (string) | Rust enum with `#[derive(FromJsValue)]` |

### 5.3 Current `FromJsValue`/`IntoJsValue` Implementations

**`IntoJsValue`** (Rust → JS): `f64`, `i32`, `i64`, `u32`, `bool`, `String`, `&str`, `Option<T>`, `Result<T, E>` (where `E: Into<ExpoError>`), `Vec<T>` (placeholder), `()`, `JsValue`

**`FromJsValue`** (JS → Rust): `f64`, `i32`, `i64`, `u32`, `bool`, `String`, `Option<T>`, `JsValue`

**Error types**: `ExpoError { code, message }` — converts from `String`, `&str`, or constructed via `ExpoError::new(code, message)`. `Result<T, ExpoError>` maps `Ok(v)` to the value's JS representation and `Err(e)` to `JsValue::Error`, which the callback dispatcher converts to a thrown JS exception via `jsi_throw_error`.

### 5.4 Planned: Derive Macros for Structs/Enums

```rust
#[derive(FromJsValue, IntoJsValue)]
struct UserOptions {
    name: String,
    age: u32,
    #[jsi(optional)]
    email: Option<String>,
}

#[derive(FromJsValue, IntoJsValue)]
enum ImageFormat {
    #[jsi(rename = "jpeg")]
    Jpeg,
    #[jsi(rename = "png")]
    Png,
    #[jsi(rename = "webp")]
    WebP,
}
```

---

## 6. Async Function Support

Expo's async functions return Promises to JavaScript. In Rust, this maps to `Future`:

### 6.1 Design

```rust
#[expo_module("Downloader")]
impl DownloaderModule {
    #[async_fn]
    async fn download(url: String) -> Result<Vec<u8>, ExpoError> {
        let response = reqwest::get(&url).await
            .map_err(|e| ExpoError::new("NETWORK_ERROR", e.to_string()))?;
        Ok(response.bytes().await?.to_vec())
    }
}
```

### 6.2 Implementation Plan

The async bridge will:
1. When JS calls the function, create a JSI Promise
2. Spawn the Rust future on a Rust async runtime (tokio or async-std)
3. When the future completes, resolve/reject the Promise on the JS thread

```rust
// Internal implementation (planned)
fn wrap_async<F, T, E>(future_fn: F) -> impl Fn(&Runtime, &[Value]) -> Value
where
    F: Fn(Args) -> Pin<Box<dyn Future<Output = Result<T, E>>>>,
    T: IntoJsValue,
    E: Into<ExpoError>,
{
    move |runtime, args| {
        let (promise, resolve, reject) = create_jsi_promise(runtime);
        let parsed_args = parse_args(runtime, args);
        let future = future_fn(parsed_args);

        TOKIO_RUNTIME.spawn(async move {
            match future.await {
                Ok(value) => call_on_js_thread(move |rt| resolve(rt, value.into_js_value())),
                Err(err) => call_on_js_thread(move |rt| reject(rt, err.into())),
            }
        });

        promise
    }
}
```

---

## 7. Build System Integration

### 7.1 Android (Gradle + CMake + cargo-ndk)

The Android build already uses CMake for C++ compilation. Adding Rust requires:

```cmake
# In CMakeLists.txt
include(FetchContent)
FetchContent_Declare(
    Corrosion
    GIT_REPOSITORY https://github.com/corrosion-rs/corrosion.git
    GIT_TAG v0.5
)
FetchContent_MakeAvailable(Corrosion)
corrosion_import_crate(MANIFEST_PATH ${RUST_MODULE_PATH}/Cargo.toml)
target_link_libraries(expo-modules-core PRIVATE my_rust_module)
```

**Gradle integration:**
```groovy
// build.gradle
task buildRust(type: Exec) {
    commandLine 'cargo', 'ndk',
        '-t', 'armeabi-v7a', '-t', 'arm64-v8a',
        '-t', 'x86', '-t', 'x86_64',
        '-o', "${buildDir}/rust-libs",
        'build', '--release'
}
tasks.named("preBuild").configure { dependsOn buildRust }
```

### 7.2 iOS (CocoaPods + cargo build)

```ruby
# In podspec
Pod::Spec.new do |s|
  s.vendored_libraries = 'libs/libmy_rust_module.a'
  s.script_phase = {
    :name => 'Build Rust',
    :script => 'cd "${PODS_TARGET_SRCROOT}/rust" && cargo build --release --target aarch64-apple-ios',
    :execution_position => :before_compile
  }
end
```

### 7.3 Autolinking

The `expo-module.config.json` needs a `rust` section:

```json
{
  "platforms": ["android", "ios"],
  "rust": {
    "cratePath": "./rust",
    "moduleEntrySymbol": "expo_module_get_definition"
  },
  "android": {
    "modules": ["expo.modules.rustjsi.ExpoRustJsiModule"]
  },
  "apple": {
    "modules": ["ExpoRustJsiModule"]
  }
}
```

The autolinking system will:
1. Detect the `rust` config key
2. Generate build scripts to compile the Rust crate for target architectures
3. Link the resulting static library
4. The bootstrap Kotlin/Swift module passes `jsi::Runtime*` to Rust, which installs all modules

---

## 8. Challenges and Risks

### 8.1 Build Complexity
Adding Rust to the build pipeline introduces cargo, rustup, and cross-compilation toolchains. Every developer and CI system would need Rust installed. **Mitigation:** Make Rust support opt-in per module, not required for all Expo users.

### 8.2 Binary Size
Rust static libraries add to app size. A minimal Rust library adds ~200-500KB after stripping. **Mitigation:** Use `#![no_std]` where possible, aggressive LTO, and strip symbols.

### 8.3 JSI API Stability
JSI's C++ API changes between React Native versions. Rust bindings would need to track these changes. **Mitigation:** The `cxx` shim layer isolates Rust from JSI internals — only `jsi_shim.cpp` needs updating when JSI changes.

### 8.4 Debugging
Debugging across JS → C++ → Rust boundaries is challenging. **Mitigation:** Good error propagation, source maps for Rust panics, integration with platform debuggers.

### 8.5 Developer Experience
Module authors would need to know Rust. **Mitigation:** The `#[expo_module]` proc macro minimizes boilerplate, and the API mirrors the Kotlin/Swift DSL patterns.

---

## 9. Comparison with Existing Approaches

| Feature | Kotlin/Swift DSL | Rust (this design) |
|---------|------------------|--------------------|
| Cross-platform code | No (per-platform) | Yes |
| Memory safety | GC / ARC | Guaranteed |
| Performance | Good (JIT/AOT) | Excellent |
| Ecosystem | Platform SDKs | Rich (crates.io) |
| DSL ergonomics | Excellent | Good (with proc macros) |
| Platform API access | Direct | Via FFI |
| Async support | Coroutines/async-await | Futures (planned) |
| Build complexity | Low | Medium-High |
| Requires PR #43580 | N/A | No |

---

## 10. Roadmap

### Phase 1: Stabilize Core (Complete)

- [x] `ModuleBuilder` with typed sync functions (0-8 params)
- [x] `#[expo_module]` proc macro with `#[constant]` and `#[async_fn]`
- [x] `FromJsValue` / `IntoJsValue` trait implementations (primitives, `Option<T>`, `Result<T, E>`)
- [x] JSI bridge layer via `cxx` (`jsi_shim.cpp` + `bridge.rs`)
- [x] Example modules: `MathModule`, `StringModule` (with sync, async, and 5-param functions)
- [x] Bootstrap modules: `ExpoRustJsiModule.kt`, `ExpoRustJsiModule.swift`
- [x] Callable host functions: `jsi_create_host_function` + Rust callback registry
- [x] Error propagation: `Result<T, ExpoError>` → `JsValue::Error` → `jsi_throw_error` → JS exception
- [x] Type conversion errors return `JsValue::Error` instead of silent `undefined`
- [x] Standalone build mode (`EXPO_RUST_JSI_STANDALONE`) for testing without JSI headers
- [x] Async function bridge: `#[async_fn]` → JS Promise via `jsi_create_promise` + `PromiseHandle` resolve/reject
- [x] Support for 5-8 parameter functions (`sync_fn_5` through `sync_fn_8`, `async_fn_5` through `async_fn_8`)
- [x] Unit tests (25 tests covering value conversion, module builder, callback registry, error propagation, arities 0-8, async builder)

### Phase 2: Build System Integration (Mostly Complete)

- [x] Android: Gradle `build.gradle.kts` with `cargo build` tasks per ABI + CMake integration
- [x] Android: JNI entry point (`jni_entry.cpp`) bridges `nativeInstall` → `expo_rust_jsi_install`
- [x] Android: `CMakeLists.txt` finds cxx-generated headers and links Rust static library
- [x] iOS: CocoaPods script phase for `cargo build --target` (aarch64-apple-ios, x86_64-apple-ios, aarch64-apple-ios-sim)
- [x] iOS: Bridging header exposes `expo_rust_jsi_install` to Swift
- [x] `expo-module.config.json` for autolinking (`ExpoRustJsiModule` on both platforms)
- [x] TypeScript API with typed re-exports (`RustMath`, `RustString`)
- [x] Integration test suite (`__tests__/RustModules.test.ts`)
- [ ] CI: Add Rust toolchain to EAS Build images (or document manual setup)

### Phase 3: Advanced Features

- [ ] `#[derive(FromJsValue, IntoJsValue)]` for structs/enums
- [ ] SharedObject support (persistent Rust objects accessible from JS)
- [ ] View module support (Rust-backed native views)
- [ ] Event emission (`sendEvent` from Rust to JS listeners)
- [ ] `serde` integration for complex type marshaling

### Phase 4: Eliminate C++ Shim (Future)

- [ ] Rust creates `jsi::Object`/`jsi::Function` directly via `cxx` without `jsi_shim.cpp`
- [ ] Safe Rust wrappers around JSI's full C++ API
- [ ] Zero-overhead module installation

---

## 11. Conclusion

The `expo-rust-jsi` package demonstrates a working Rust ↔ JSI integration where module authors write plain Rust functions and the `#[expo_module]` macro generates all JSI wiring. The design talks directly to JSI through a thin `cxx` bridge — no dependency on the Kotlin/Swift DSL, no dependency on PR #43580's C++ Module API.

**Current status: Phase 1 complete, MVP ready for device testing.** The full pipeline from Rust → C++ → JSI → JavaScript is wired up. Both sync and async functions work: sync functions return values directly, async functions (`#[async_fn]`) return JS Promises via `jsi_create_promise` + `PromiseHandle`. Functions support 0-8 typed parameters. Error propagation works end-to-end: `Result<T, ExpoError>` in Rust becomes a thrown JS exception. Build system integration is complete for both Android (Gradle + CMake + JNI) and iOS (CocoaPods + bridging header). TypeScript types and integration tests are provided. 25 unit tests pass.

**What remains for production:** CI toolchain setup, and advanced features (derive macros, SharedObject, events, true background async via `CallInvoker`).

**The key unlock is cross-platform shared native code** — writing module logic once in Rust instead of twice in Kotlin + Swift, with direct JSI access for maximum performance.
