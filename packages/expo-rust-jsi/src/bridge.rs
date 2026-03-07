use crate::value::{JsValue, Runtime};
use std::collections::HashMap;
use std::sync::Mutex;

/// The cxx bridge module defining the Rust <-> C++ JSI interop boundary.
///
/// This module declares:
/// - C++ types and functions available to Rust (the JSI shim layer)
/// - Rust types and functions available to C++ (callbacks for host functions)
#[cxx::bridge(namespace = "expo::rust_jsi")]
pub mod ffi {
    /// Mirrors the C++ ValueKind enum
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    enum ValueKind {
        Undefined = 0,
        Null = 1,
        Boolean = 2,
        Number = 3,
        String = 4,
        Object = 5,
        Array = 6,
    }

    /// A value that can cross the FFI boundary safely.
    /// Corresponds to the C++ FfiValue struct.
    #[derive(Debug, Clone)]
    struct FfiValue {
        kind: ValueKind,
        bool_val: bool,
        number_val: f64,
        string_val: String,
        handle: u64,
    }

    /// Opaque handle to a jsi::Runtime.
    struct RuntimeHandle {
        ptr: *mut u8, // void* in C++
    }

    unsafe extern "C++" {
        include!("jsi_shim.h");

        // Value constructors
        fn jsi_make_undefined() -> FfiValue;
        fn jsi_make_null() -> FfiValue;
        fn jsi_make_bool(val: bool) -> FfiValue;
        fn jsi_make_number(val: f64) -> FfiValue;
        fn jsi_make_string(val: &str) -> FfiValue;

        // Object operations
        fn jsi_create_object(rt: &RuntimeHandle) -> FfiValue;
        fn jsi_object_set_property(
            rt: &RuntimeHandle,
            obj_handle: u64,
            name: &str,
            value: &FfiValue,
        );
        fn jsi_object_get_property(
            rt: &RuntimeHandle,
            obj_handle: u64,
            name: &str,
        ) -> FfiValue;

        // Array operations
        fn jsi_create_array(rt: &RuntimeHandle, length: u32) -> FfiValue;
        fn jsi_array_set_value(
            rt: &RuntimeHandle,
            arr_handle: u64,
            index: u32,
            value: &FfiValue,
        );
        fn jsi_array_get_value(
            rt: &RuntimeHandle,
            arr_handle: u64,
            index: u32,
        ) -> FfiValue;
        fn jsi_array_length(rt: &RuntimeHandle, arr_handle: u64) -> u32;

        // Module registration
        fn jsi_register_module(rt: &RuntimeHandle, name: &str, obj_handle: u64);

        // Host function creation — creates a JSI Function backed by Rust callback
        fn jsi_create_host_function(
            rt: &RuntimeHandle,
            name: &str,
            param_count: u32,
            callback_id: u64,
        ) -> FfiValue;

        // Set a host function as a property on an object
        fn jsi_object_set_host_function(
            rt: &RuntimeHandle,
            obj_handle: u64,
            name: &str,
            fn_handle: u64,
        );

        // Throw a JS error
        fn jsi_throw_error(rt: &RuntimeHandle, message: &str);

        // Promise creation — returns an object FfiValue.
        // The object has properties "promise", "resolve", "reject" (all handles).
        fn jsi_create_promise(rt: &RuntimeHandle) -> FfiValue;

        // Call a JS function (e.g. resolve/reject) with a single argument
        fn jsi_call_function(
            rt: &RuntimeHandle,
            fn_handle: u64,
            arg: &FfiValue,
        );
    }

    // Rust functions callable from C++
    extern "Rust" {
        /// Called by C++ when JS invokes a Rust-backed host function.
        /// The callback_id identifies which Rust function to call.
        fn rust_invoke_host_fn(
            callback_id: u64,
            rt: &RuntimeHandle,
            args: &[FfiValue],
        ) -> FfiValue;
    }
}

// ---- Callback registry ----

type HostFnCallback =
    Box<dyn Fn(&Runtime, Vec<JsValue>) -> JsValue + Send + Sync + 'static>;

static CALLBACK_REGISTRY: Mutex<Option<CallbackRegistry>> = Mutex::new(None);

struct CallbackRegistry {
    callbacks: HashMap<u64, HostFnCallback>,
    next_id: u64,
}

impl CallbackRegistry {
    fn new() -> Self {
        Self {
            callbacks: HashMap::new(),
            next_id: 1,
        }
    }
}

/// Register a Rust function in the callback registry, returning a unique ID.
/// The C++ side uses this ID to route JS function calls back to the right Rust fn.
pub fn register_callback<F>(callback: F) -> u64
where
    F: Fn(&Runtime, Vec<JsValue>) -> JsValue + Send + Sync + 'static,
{
    let mut guard = CALLBACK_REGISTRY.lock().unwrap();
    let registry = guard.get_or_insert_with(CallbackRegistry::new);
    let id = registry.next_id;
    registry.next_id += 1;
    registry.callbacks.insert(id, Box::new(callback));
    id
}

/// Called by C++ when JS invokes a Rust-backed host function.
fn rust_invoke_host_fn(
    callback_id: u64,
    rt: &ffi::RuntimeHandle,
    args: &[ffi::FfiValue],
) -> ffi::FfiValue {
    let runtime = Runtime {
        handle: ffi::RuntimeHandle { ptr: rt.ptr },
    };

    // Convert FfiValue args to JsValue
    let js_args: Vec<JsValue> = args.iter().map(|a| JsValue::from_ffi(a.clone())).collect();

    // Look up and invoke the callback
    let result = {
        let guard = CALLBACK_REGISTRY.lock().unwrap();
        if let Some(registry) = guard.as_ref() {
            if let Some(func) = registry.callbacks.get(&callback_id) {
                func(&runtime, js_args)
            } else {
                JsValue::Undefined
            }
        } else {
            JsValue::Undefined
        }
    };

    // If the function returned an Error, throw a JS exception.
    // jsi_throw_error throws a C++ exception which unwinds through JSI,
    // so the return below is only reached in standalone/test mode.
    if let JsValue::Error(ref msg) = result {
        ffi::jsi_throw_error(rt, msg.as_str());
        return ffi::jsi_make_undefined();
    }

    result.to_ffi()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_register_callback_returns_unique_ids() {
        let id1 = register_callback(|_rt, _args| JsValue::Undefined);
        let id2 = register_callback(|_rt, _args| JsValue::Number(42.0));
        assert_ne!(id1, id2);
        assert!(id1 > 0);
        assert!(id2 > 0);
    }

    #[test]
    fn test_callback_registry_stores_and_retrieves() {
        let id = register_callback(|_rt, _args| JsValue::String("hello".into()));

        let guard = CALLBACK_REGISTRY.lock().unwrap();
        let registry = guard.as_ref().unwrap();
        assert!(registry.callbacks.contains_key(&id));
    }
}
