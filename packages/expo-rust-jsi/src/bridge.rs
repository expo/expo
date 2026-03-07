/// The cxx bridge module defining the Rust <-> C++ JSI interop boundary.
///
/// This module declares:
/// - C++ types and functions available to Rust (the JSI shim layer)
/// - Rust types and functions available to C++ (callbacks for HostObject)
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
    }
}
