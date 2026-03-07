//! # expo-rust-jsi
//!
//! Rust bindings for writing Expo native modules that integrate directly with
//! the JavaScript Interface (JSI) runtime.
//!
//! This crate provides a safe Rust API for creating native modules that are
//! accessible from JavaScript without going through the Kotlin/Swift DSL layers.
//! Instead, Rust code communicates directly with the JSI C++ layer via `cxx`.
//!
//! ## Architecture
//!
//! ```text
//! ┌─────────────┐     ┌──────────────┐     ┌──────────────┐
//! │  JavaScript  │────▶│   JSI (C++)   │────▶│  Rust Module │
//! │   (Hermes)   │◀────│  jsi_shim.cpp │◀────│  (this crate)│
//! └─────────────┘     └──────────────┘     └──────────────┘
//!         │                   │                     │
//!    JS calls            cxx bridge            ExpoModule
//!    module.fn()         FfiValue              trait impl
//! ```
//!
//! ## Quick Start
//!
//! ```rust,ignore
//! use expo_rust_jsi::prelude::*;
//!
//! struct MathModule;
//!
//! impl ExpoModule for MathModule {
//!     fn definition() -> ModuleDefinition {
//!         ModuleBuilder::new("RustMath")
//!             .sync_fn_2::<f64, f64, f64, _>("add", |a, b| a + b)
//!             .sync_fn_2::<f64, f64, f64, _>("multiply", |a, b| a * b)
//!             .sync_fn_1::<f64, f64, _>("sqrt", |x| x.sqrt())
//!             .constant("PI", std::f64::consts::PI)
//!             .constant("E", std::f64::consts::E)
//!             .build()
//!     }
//! }
//! ```

pub mod bridge;
pub mod module;
pub mod value;

/// Prelude module - import everything needed for module development.
pub mod prelude {
    pub use crate::module::{ExpoModule, ModuleBuilder, ModuleDefinition, ModuleRegistry};
    pub use crate::value::{FromJsValue, IntoJsValue, JsArray, JsObject, JsValue, Runtime};
}

/// C entry point called from the native side (Android JNI or iOS ObjC++)
/// to initialize Rust modules on the JSI runtime.
///
/// # Safety
/// The runtime_ptr must be a valid pointer to a `jsi::Runtime`.
#[no_mangle]
pub unsafe extern "C" fn expo_rust_jsi_install(runtime_ptr: *mut std::ffi::c_void) {
    if runtime_ptr.is_null() {
        return;
    }

    let rt = Runtime {
        handle: bridge::ffi::RuntimeHandle {
            ptr: runtime_ptr as *mut u8,
        },
    };

    // Get the module registry and install all modules
    let registry = get_module_registry();
    registry.install(&rt);
}

/// Returns the global module registry.
/// Modules register themselves in this registry (typically via autolinking or
/// explicit registration in a setup function).
fn get_module_registry() -> module::ModuleRegistry {
    let mut registry = module::ModuleRegistry::new();

    // Auto-register modules that were registered via the inventory pattern
    // or explicit registration. In a real build, this would be populated
    // by the build system / autolinking.
    #[cfg(feature = "example_modules")]
    {
        registry.register::<crate::examples::MathModule>();
        registry.register::<crate::examples::StringModule>();
    }

    registry
}

#[cfg(feature = "example_modules")]
pub mod examples;
