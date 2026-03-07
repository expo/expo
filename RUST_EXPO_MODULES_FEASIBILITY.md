# Feasibility Analysis: First-Class Rust Support in Expo Modules

## Executive Summary

First-class Rust support in Expo Modules is **technically feasible** and would integrate naturally with the existing architecture. The key insight is that the Expo Modules system already has a C++/JSI layer at its core — Rust can plug into this same layer via C FFI. PR #43580 (C++ API POC) provides an excellent foundation that would make Rust integration significantly easier, as it demonstrates that modules can be defined purely in C++ with direct JSI access, bypassing the Kotlin/Swift DSL entirely.

There are three viable approaches, ranging from pragmatic (Rust libraries called from Kotlin/Swift modules) to ambitious (a full Rust DSL that mirrors the Kotlin/Swift one). This document analyzes each in detail.

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

## 2. PR #43580: C++ API POC

### 2.1 What It Introduces

PR #43580 adds a proof-of-concept for defining Expo modules directly in C++ using a DSL that mirrors the Kotlin/Swift APIs:

```cpp
class MyCppModule : public CppModule {
  ModuleDefinitionData definition() override {
    return ModuleDefinition([](auto &m) {
      m.Name("MyCppModule");
      m.Function("add", [](int a, int b) { return a + b; });
      m.Function("greet", [](std::string name) {
        return "Hello, " + name + "!";
      });
    });
  }
};
```

### 2.2 Key Technical Components

- **`CppModule`**: Abstract base class with `definition()` virtual method and `install(runtime, parent)` to register into JSI
- **`ModuleDefinition`**: Builder class with `Name()`, `Function()`, `Property()` methods
- **`ModuleDefinitionData`**: Holds function/property entries; `decorate()` installs them as JSI host functions
- **`jsi_function_binding.h`**: Template metaprogramming to automatically bind C++ lambdas to JSI's `HostFunctionType` signature
- **`callable_traits.h`**: Extracts return type, argument types from any callable
- **`convert_from_jsi.h/cpp`**: Converts `jsi::Value` → C++ types (int, double, string, bool)
- **`convert_to_jsi.h/cpp`**: Converts C++ types → `jsi::Value`

### 2.3 Significance for Rust

This PR is **extremely significant** for Rust support because:

1. It proves that modules can bypass the Kotlin/Swift DSL entirely and operate at the C++/JSI level
2. The `CppModule::install()` method directly decorates a `jsi::Object` — Rust can do the same via C FFI
3. The type conversion system (`convert_from_jsi` / `convert_to_jsi`) provides the pattern that a Rust version would follow
4. It's cross-platform by nature — the same C++ code works on both Android and iOS (via the shared `common/cpp/` directory)

---

## 3. Rust Integration Approaches

### Approach A: Rust as a Library (Called from Kotlin/Swift Modules)

**Complexity: Low | Value: Medium**

Use Rust for compute-heavy logic, exposed via C FFI, called from traditional Kotlin/Swift modules.

```
JS → JSI → Kotlin/Swift Module DSL → JNI/C-bridge → Rust library
```

**How it works:**
1. Write Rust library with `#[no_mangle] pub extern "C" fn` exports
2. Build with `cargo-ndk` (Android) / `cargo-lipo` (iOS) for target architectures
3. Link the static library in CMakeLists.txt (Android) / podspec (iOS)
4. Call from Kotlin via JNI or from Swift via C bridging header
5. Module registration stays in Kotlin/Swift using the existing DSL

**Example:**
```rust
// rust/src/lib.rs
#[no_mangle]
pub extern "C" fn rust_process_image(
    data: *const u8, len: usize, width: u32, height: u32
) -> *mut u8 {
    // Heavy computation in Rust
}
```

```kotlin
// Android module
class ImageProcessorModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ImageProcessor")
    AsyncFunction("process") { data: ByteArray ->
      // Call into Rust via JNI
      nativeProcessImage(data)
    }
  }
  private external fun nativeProcessImage(data: ByteArray): ByteArray
}
```

**Pros:**
- Minimal changes to expo-modules-core
- Works with existing autolinking and module discovery
- Battle-tested pattern (many RN libraries do this already)
- Rust code is shared across platforms

**Cons:**
- Still requires Kotlin + Swift wrapper code per module
- Double marshaling: JS → Kotlin → JNI → Rust → JNI → Kotlin → JS
- No Rust DSL; you're just using Rust as a "backend"

### Approach B: Rust Modules via C++ API (Building on PR #43580)

**Complexity: Medium | Value: High**

Extend the C++ API from PR #43580 to support Rust modules that register directly into JSI.

```
JS → JSI → C++ shim → Rust module (via C FFI)
```

**How it works:**
1. Rust module defines functions using a Rust DSL (proc macros)
2. At build time, Rust generates C-compatible function pointers and metadata
3. A thin C++ shim reads the Rust-provided metadata and registers functions into JSI
4. The module is discovered by the autolinking system via `expo-module.config.json`

**Rust DSL (conceptual):**
```rust
use expo_modules_rust::prelude::*;

#[expo_module]
struct MyCryptoModule;

#[expo_module_impl]
impl MyCryptoModule {
    #[expo_name("CryptoModule")]
    fn name() {}

    #[expo_function]
    fn hash(input: String, algorithm: String) -> Result<String, ExpoError> {
        // Pure Rust implementation
        Ok(compute_hash(&input, &algorithm))
    }

    #[expo_async_function]
    async fn generate_key(bits: u32) -> Result<Vec<u8>, ExpoError> {
        // Async Rust implementation
        Ok(generate_rsa_key(bits).await)
    }
}
```

**Generated C FFI (by proc macro):**
```rust
#[no_mangle]
pub extern "C" fn expo_module_get_definition() -> *const ModuleDefinitionFFI {
    static DEF: ModuleDefinitionFFI = ModuleDefinitionFFI {
        name: "CryptoModule\0",
        functions: &[
            FunctionFFI {
                name: "hash\0",
                param_count: 2,
                invoke: crypto_module_hash_invoke,
                is_async: false,
            },
            FunctionFFI {
                name: "generateKey\0",
                param_count: 1,
                invoke: crypto_module_generate_key_invoke,
                is_async: true,
            },
        ],
    };
    &DEF
}
```

**C++ shim (in expo-modules-core):**
```cpp
// RustModuleAdapter.cpp - generic adapter for all Rust modules
class RustModuleAdapter : public CppModule {
  ModuleDefinitionFFI* rustDef;
public:
  RustModuleAdapter(ModuleDefinitionFFI* def) : rustDef(def) {}

  ModuleDefinitionData definition() override {
    return ModuleDefinition([this](auto& m) {
      m.Name(rustDef->name);
      for (auto& fn : rustDef->functions) {
        if (fn.is_async) {
          m.AsyncFunction(fn.name, [&fn](jsi::Runtime& rt, const jsi::Value* args, size_t count) {
            return fn.invoke(rt, args, count);
          });
        } else {
          m.Function(fn.name, [&fn](jsi::Runtime& rt, const jsi::Value* args, size_t count) {
            return fn.invoke(rt, args, count);
          });
        }
      }
    });
  }
};
```

**Pros:**
- True cross-platform: one Rust codebase for Android + iOS
- Direct JSI access — no double marshaling
- Ergonomic Rust DSL via proc macros
- Builds naturally on the C++ API direction Expo is already pursuing
- Type safety from Rust's type system

**Cons:**
- Requires PR #43580 to land and mature
- Need to build the `expo_modules_rust` proc macro crate
- Type conversion between JSI values and Rust types must be implemented
- Async function support requires integrating Rust futures with JS promises
- Build system changes needed (cargo integration into CMake/Gradle/CocoaPods)

### Approach C: Full Rust-Native DSL with Direct JSI Bindings

**Complexity: High | Value: Very High**

Bypass C++ entirely — Rust code binds directly to JSI via Rust-C++ interop (using `cxx` crate or manual bindings).

```
JS → JSI ← Rust (direct JSI bindings via cxx/bindgen)
```

**How it works:**
1. Create `expo-jsi-rs` crate with safe Rust wrappers around JSI's C++ API
2. Rust module directly creates `jsi::Object`, `jsi::Function`, etc.
3. Module installs itself into the runtime without any C++ adapter layer

**Example:**
```rust
use expo_jsi::*;

pub struct MyModule;

impl ExpoModule for MyModule {
    fn definition(b: &mut ModuleBuilder) {
        b.name("MyModule");

        b.sync_function("add", |a: i32, b: i32| -> i32 {
            a + b
        });

        b.async_function("fetch", |url: String| async move {
            let resp = reqwest::get(&url).await?;
            Ok(resp.text().await?)
        });

        b.property("version", || "1.0.0".to_string());
    }
}
```

**Pros:**
- Zero C++ glue code
- Maximum performance (no FFI overhead between Rust and C++)
- Full Rust ecosystem available (tokio, serde, etc.)
- Could eventually replace C++ layer entirely

**Cons:**
- Binding to JSI's C++ API from Rust is complex (JSI uses virtual dispatch, exceptions, std::string)
- `cxx` crate has limitations with JSI's API surface
- Would need to maintain JSI bindings as React Native evolves
- Highest initial investment

---

## 4. Build System Integration

### 4.1 Android (Gradle + CMake + cargo-ndk)

The Android build already uses CMake for C++ compilation. Adding Rust requires:

```cmake
# In CMakeLists.txt or a new rust.cmake
# Option 1: Use corrosion (CMake + Cargo integration)
include(FetchContent)
FetchContent_Declare(
    Corrosion
    GIT_REPOSITORY https://github.com/corrosion-rs/corrosion.git
    GIT_TAG v0.5
)
FetchContent_MakeAvailable(Corrosion)
corrosion_import_crate(MANIFEST_PATH ${RUST_MODULE_PATH}/Cargo.toml)
target_link_libraries(expo-modules-core PRIVATE my_rust_module)

# Option 2: Pre-build with cargo-ndk in build.gradle
# Simpler but less integrated
```

**Gradle integration:**
```groovy
// build.gradle
android {
    // Existing NDK/CMake config
    externalNativeBuild {
        cmake {
            path "CMakeLists.txt"
        }
    }
}

// Add Rust build task
task buildRust(type: Exec) {
    commandLine 'cargo', 'ndk',
        '-t', 'armeabi-v7a', '-t', 'arm64-v8a',
        '-t', 'x86', '-t', 'x86_64',
        '-o', "${buildDir}/rust-libs",
        'build', '--release'
}

tasks.named("preBuild").configure { dependsOn buildRust }
```

### 4.2 iOS (CocoaPods + cargo-lipo/xcodebuild)

```ruby
# In podspec
Pod::Spec.new do |s|
  # ... existing config ...

  # Add Rust static library
  s.vendored_libraries = 'libs/libmy_rust_module.a'

  # Or build Rust during pod install
  s.script_phase = {
    :name => 'Build Rust',
    :script => 'cd "${PODS_TARGET_SRCROOT}/rust" && cargo build --release --target aarch64-apple-ios',
    :execution_position => :before_compile
  }
end
```

### 4.3 Autolinking Changes

The `expo-module.config.json` would need a new `rust` section:

```json
{
  "platforms": ["android", "ios"],
  "rust": {
    "cratePath": "./rust",
    "moduleEntrySymbol": "expo_module_get_definition"
  },
  "android": {
    "modules": ["expo.modules.crypto.CryptoModule"]
  },
  "apple": {
    "modules": ["CryptoModule"]
  }
}
```

For Approach B/C (pure Rust modules), the autolinking system would:
1. Detect the `rust` config key
2. Generate build scripts to compile the Rust crate for target architectures
3. Link the resulting static library
4. Register the module via the C++ adapter or direct JSI installation

---

## 5. Type Marshaling: JSI ↔ Rust

A critical piece is converting between JavaScript/JSI types and Rust types.

### 5.1 Primitive Types

| JavaScript | JSI C++ | Rust |
|------------|---------|------|
| `number` | `double` | `f64` / `i32` / `u32` etc. |
| `string` | `jsi::String` | `String` |
| `boolean` | `bool` | `bool` |
| `null` | `jsi::Value::null()` | `Option<T>::None` |
| `undefined` | `jsi::Value::undefined()` | `()` |
| `ArrayBuffer` | `jsi::ArrayBuffer` | `Vec<u8>` / `&[u8]` |

### 5.2 Complex Types

| JavaScript | Rust |
|------------|------|
| `Object` | `HashMap<String, Value>` or custom struct with `serde::Deserialize` |
| `Array` | `Vec<T>` |
| `Promise` | `Future<Output = Result<T, E>>` |
| `TypedArray` | `Vec<T>` with element type |
| `Record` | Struct with `#[derive(FromJSI)]` |
| `Enum` (string) | Rust enum with `#[derive(FromJSI)]` |

### 5.3 Derive Macros for Automatic Conversion

```rust
#[derive(FromJSI, ToJSI)]
struct UserOptions {
    name: String,
    age: u32,
    #[jsi(optional)]
    email: Option<String>,
}

#[derive(FromJSI, ToJSI)]
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
#[expo_async_function]
async fn download(url: String) -> Result<Vec<u8>, ExpoError> {
    let response = reqwest::get(&url).await
        .map_err(|e| ExpoError::new("NETWORK_ERROR", e.to_string()))?;
    Ok(response.bytes().await?.to_vec())
}
```

### 6.2 Implementation

The async bridge would:
1. When JS calls the function, create a JSI Promise
2. Spawn the Rust future on a Rust async runtime (tokio or async-std)
3. When the future completes, resolve/reject the Promise on the JS thread

```rust
// Internal implementation
fn wrap_async<F, T, E>(future_fn: F) -> impl Fn(&Runtime, &[Value]) -> Value
where
    F: Fn(Args) -> Pin<Box<dyn Future<Output = Result<T, E>>>>,
    T: ToJSI,
    E: Into<ExpoError>,
{
    move |runtime, args| {
        let (promise, resolve, reject) = create_jsi_promise(runtime);
        let parsed_args = parse_args(runtime, args);
        let future = future_fn(parsed_args);

        TOKIO_RUNTIME.spawn(async move {
            match future.await {
                Ok(value) => call_on_js_thread(move |rt| resolve(rt, value.to_jsi(rt))),
                Err(err) => call_on_js_thread(move |rt| reject(rt, err.into())),
            }
        });

        promise
    }
}
```

---

## 7. Chosen Approach & Current Implementation

We are pursuing **Approach B** — a proc-macro-based Rust DSL that integrates with
JSI through a thin C++ shim layer via the `cxx` crate. The implementation lives in
`packages/expo-rust-jsi/`.

### 7.1 What's Been Built

The `expo-rust-jsi` package now contains a working foundation:

| Crate | Purpose |
|-------|---------|
| `expo-rust-jsi` | Core runtime: `ModuleBuilder`, `ExpoModule` trait, JSI bridge via `cxx`, type conversion (`FromJsValue`/`IntoJsValue`) |
| `expo-module-macro` | Proc macro crate: `#[expo_module("Name")]` attribute that generates `ExpoModule` impl from a plain `impl` block |

#### The `#[expo_module]` Proc Macro

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
        // compute-heavy logic stays in Rust
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

**Key features of the macro:**
- Function arity (0–4 params) and types are inferred from the Rust signature
- `#[constant]` works on both `const` items and zero-arg methods
- `#[async_fn]` marks methods for async JS function registration
- Methods remain callable as `MathModule::add(1.0, 2.0)` from Rust
- `&self` is rejected at compile time — module functions must be static

#### Type Conversion Layer

The `value` module provides `FromJsValue` and `IntoJsValue` traits with implementations for:
- Primitives: `f64`, `i32`, `i64`, `u32`, `bool`, `String`
- Containers: `Option<T>`, `Vec<T>`
- Pass-through: `JsValue`, `JsObject`, `JsArray`
- Unit: `()` ↔ `undefined`

#### JSI Bridge

The `bridge` module uses the `cxx` crate to communicate with C++ JSI:
- `FfiValue` enum bridges Rust ↔ C++ value types
- `RuntimeHandle` wraps a raw pointer to `jsi::Runtime`
- FFI functions: `jsi_register_module`, `jsi_create_object`, `jsi_make_*`, etc.

### 7.2 Remaining Work

#### Phase 1: Stabilize Core (In Progress)

- [x] `ModuleBuilder` with typed sync functions (0–4 params)
- [x] `#[expo_module]` proc macro with `#[constant]` and `#[async_fn]`
- [x] `FromJsValue` / `IntoJsValue` trait implementations
- [x] JSI bridge layer via `cxx`
- [x] Example modules: `MathModule`, `StringModule`
- [ ] Error propagation: `Result<T, ExpoError>` → JS exceptions
- [ ] Async function bridge: Rust `Future` → JS `Promise` via tokio runtime
- [ ] Support for 5+ parameter functions (variadic or runtime dispatch)

#### Phase 2: Build System Integration

- [ ] Android: Gradle plugin wrapping `cargo-ndk` for cross-compilation
- [ ] iOS: CocoaPods script phase for `cargo build --target aarch64-apple-ios`
- [ ] `expo-module.config.json` `"rust"` key for autolinking
- [ ] CI: Add Rust toolchain to EAS Build images (or document manual setup)

#### Phase 3: Advanced Features

- [ ] `#[derive(FromJsValue, IntoJsValue)]` for structs/enums
- [ ] SharedObject support (persistent Rust objects accessible from JS)
- [ ] View module support (Rust-backed native views)
- [ ] Event emission (`sendEvent` from Rust to JS listeners)
- [ ] `serde` integration for complex type marshaling

#### Phase 4: Direct JSI Bindings (Optional, Future)

- [ ] Eliminate C++ shim — Rust creates `jsi::Object`/`jsi::Function` directly
- [ ] Safe Rust wrappers around JSI's C++ API via `cxx`
- [ ] Zero-overhead module installation

---

## 8. Challenges and Risks

### 8.1 Build Complexity
Adding Rust to the build pipeline introduces cargo, rustup, and cross-compilation toolchains. Every developer and CI system would need Rust installed. **Mitigation:** Make Rust support opt-in per module, not required for all Expo users.

### 8.2 Binary Size
Rust static libraries add to app size. A minimal Rust library adds ~200-500KB after stripping. **Mitigation:** Use `#![no_std]` where possible, aggressive LTO, and strip symbols.

### 8.3 JSI API Stability
JSI's C++ API changes between React Native versions. Rust bindings would need to track these changes. **Mitigation:** Abstract JSI behind a stable C ABI layer (Approach B naturally does this).

### 8.4 Debugging
Debugging across JS → C++ → Rust boundaries is challenging. **Mitigation:** Good error propagation, source maps for Rust panics, integration with platform debuggers.

### 8.5 Developer Experience
Module authors would need to know Rust. **Mitigation:** Excellent proc macros, clear error messages, comprehensive documentation, and templates.

---

## 9. Comparison with Existing Approaches

| Feature | Kotlin/Swift DSL | C++ API (PR #43580) | Rust (Proposed) |
|---------|------------------|---------------------|-----------------|
| Cross-platform code | No (per-platform) | Yes | Yes |
| Memory safety | GC / ARC | Manual | Guaranteed |
| Performance | Good (JIT/AOT) | Excellent | Excellent |
| Ecosystem | Platform SDKs | Limited | Rich (crates.io) |
| DSL ergonomics | Excellent | Good | Good (with proc macros) |
| Platform API access | Direct | Via JNI/ObjC | Via FFI |
| Async support | Coroutines/async-await | TBD | Futures |
| Build complexity | Low | Medium | Medium-High |

---

## 10. Conclusion

First-class Rust support in Expo Modules is not only feasible — it's actively under development. The `expo-rust-jsi` package demonstrates a working proc-macro DSL where module authors write plain Rust functions and the `#[expo_module]` macro generates all the JSI integration code.

**Current status:** The core abstraction (trait, builder, proc macro, type conversion, JSI bridge) is implemented. What remains is build-system integration (Gradle/CocoaPods), error/async bridges, and advanced features (derive macros, SharedObject, events).

**What we chose and why:**
- **Approach B** (Rust DSL + C++ shim via `cxx`) — best balance of ergonomics, safety, and incremental delivery
- The proc macro approach means module authors write zero boilerplate: no turbofish generics, no manual type annotations, no `Box<dyn Fn>` closures
- The `cxx` bridge keeps the unsafe boundary small and auditable

**The key unlock remains cross-platform shared native code** — writing module logic once in Rust instead of twice in Kotlin + Swift. The `#[expo_module]` DSL makes this nearly as ergonomic as the Kotlin/Swift DSLs while adding Rust's memory safety, performance, and access to the crates.io ecosystem.
