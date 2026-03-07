# expo-rust-jsi

Rust bindings for writing Expo native modules that integrate **directly with JSI** (JavaScript Interface), bypassing the Kotlin/Swift DSL layers entirely.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  JavaScript  │────▶│   JSI (C++)   │────▶│  Rust Module │
│   (Hermes)   │◀────│  jsi_shim.cpp │◀────│  (Rust crate)│
└─────────────┘     └──────────────┘     └──────────────┘
        │                   │                     │
   JS calls            cxx bridge            ExpoModule
   module.fn()         FfiValue              trait impl
```

Rust code communicates directly with the C++ JSI layer via the [`cxx`](https://cxx.rs/) crate. No Kotlin or Swift code is involved in the module's function dispatch path.

### How it works

1. **C++ shim** (`cpp/jsi_shim.cpp`) - Wraps JSI types (`jsi::Runtime`, `jsi::Value`, `jsi::HostObject`) into C-compatible types that can cross the FFI boundary
2. **cxx bridge** (`src/bridge.rs`) - Declares the Rust ↔ C++ interop using `#[cxx::bridge]`
3. **Rust module API** (`src/module.rs`) - Provides the `ExpoModule` trait and `ModuleBuilder` DSL
4. **Platform loaders** - Thin Android (Kotlin/JNI) and iOS (Swift) wrappers that obtain the `jsi::Runtime*` pointer and pass it to Rust

## Writing a Module

```rust
use expo_rust_jsi::prelude::*;

struct MathModule;

impl ExpoModule for MathModule {
    fn definition() -> ModuleDefinition {
        ModuleBuilder::new("RustMath")
            // Type-safe function registration
            .sync_fn_2::<f64, f64, f64, _>("add", |a, b| a + b)
            .sync_fn_2::<f64, f64, f64, _>("multiply", |a, b| a * b)
            .sync_fn_1::<f64, f64, _>("sqrt", |x| x.sqrt())
            // Constants
            .constant("PI", std::f64::consts::PI)
            .constant("E", std::f64::consts::E)
            // Raw function with full runtime access
            .function("compute", 1, |rt, args| {
                let n = f64::from_js_value(&args[0]).unwrap_or(0.0);
                (n * n).into_js_value()
            })
            .build()
    }
}
```

### Using from JavaScript

```ts
import { requireNativeModule } from 'expo-modules-core';

const RustMath = requireNativeModule('RustMath');

console.log(RustMath.PI);            // 3.141592653589793
console.log(RustMath.add(2, 3));     // 5
console.log(RustMath.multiply(4, 5)); // 20
console.log(RustMath.sqrt(16));       // 4
```

## Type System

The bridge handles automatic conversion between JS and Rust types:

| JavaScript | Rust | Notes |
|-----------|------|-------|
| `undefined` | `JsValue::Undefined` | |
| `null` | `JsValue::Null` / `Option<T>` → `None` | |
| `boolean` | `bool` | |
| `number` | `f64`, `i32`, `i64`, `u32` | All JS numbers are f64 |
| `string` | `String`, `&str` | UTF-8 |
| `object` | `JsObject` | Handle-based |
| `Array` | `JsArray` | Handle-based |

## Prerequisites

- [Rust toolchain](https://rustup.rs/) (1.70+)
- For Android: `cargo-ndk` and Android NDK
- For iOS: Rust targets `aarch64-apple-ios`, `x86_64-apple-ios`

```sh
# Install Rust targets
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android
rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim

# Install cargo-ndk for Android builds
cargo install cargo-ndk
```

## Building

```sh
# Build for host (testing)
cargo build

# Build for Android (all ABIs)
npm run build:rust:android

# Build for iOS
npm run build:rust:ios
```

## Project Structure

```
expo-rust-jsi/
├── Cargo.toml              # Rust workspace root
├── build.rs                # cxx-build integration
├── src/
│   ├── lib.rs              # Crate root, C entry point
│   ├── bridge.rs           # cxx bridge declarations
│   ├── module.rs           # ExpoModule trait, ModuleBuilder
│   └── value.rs            # JsValue type system
├── cpp/
│   ├── jsi_shim.h          # C++ shim header
│   ├── jsi_shim.cpp        # C++ shim implementation (RustHostObject, type conversion)
│   └── jsi_types.h         # Standalone JSI stubs for CI
├── expo-module-macro/      # Proc-macro crate for #[expo_module]
├── android/
│   ├── CMakeLists.txt      # Android native build
│   ├── build.gradle.kts    # Gradle + Cargo integration
│   └── src/main/
│       ├── cpp/jni_entry.cpp           # JNI → Rust bridge
│       └── java/.../ExpoRustJsiModule.kt  # Kotlin loader
├── ios/
│   ├── ExpoRustJsiModule.swift         # Swift loader
│   └── ExpoRustJsi-Bridging-Header.h   # C bridge header
├── examples/
│   └── math_module.rs      # Example modules
└── expo-rust-jsi.podspec   # CocoaPods spec
```
