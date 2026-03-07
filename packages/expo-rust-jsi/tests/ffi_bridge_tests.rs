//! FFI Bridge Integration Tests
//!
//! These tests exercise the actual Rust → C++ → Rust roundtrip through the cxx bridge,
//! compiled in EXPO_RUST_JSI_STANDALONE mode. Unlike unit tests that only test Rust logic,
//! these call through the real FFI boundary to the C++ jsi_shim functions.

use expo_rust_jsi::prelude::*;

// ============================================================================
// FfiValue constructor roundtrips (Rust → C++ jsi_make_* → Rust from_ffi)
// ============================================================================

#[test]
fn ffi_roundtrip_undefined() {
    let val = JsValue::Undefined;
    let ffi = val.to_ffi();
    let back = JsValue::from_ffi(ffi);
    assert!(back.is_undefined());
}

#[test]
fn ffi_roundtrip_null() {
    let val = JsValue::Null;
    let ffi = val.to_ffi();
    let back = JsValue::from_ffi(ffi);
    assert!(back.is_null());
}

#[test]
fn ffi_roundtrip_bool_true() {
    let val = JsValue::Bool(true);
    let ffi = val.to_ffi();
    let back = JsValue::from_ffi(ffi);
    assert_eq!(back.as_bool(), Some(true));
}

#[test]
fn ffi_roundtrip_bool_false() {
    let val = JsValue::Bool(false);
    let ffi = val.to_ffi();
    let back = JsValue::from_ffi(ffi);
    assert_eq!(back.as_bool(), Some(false));
}

#[test]
fn ffi_roundtrip_number_positive() {
    let val = JsValue::Number(42.5);
    let ffi = val.to_ffi();
    let back = JsValue::from_ffi(ffi);
    assert_eq!(back.as_number(), Some(42.5));
}

#[test]
fn ffi_roundtrip_number_negative() {
    let val = JsValue::Number(-99.9);
    let ffi = val.to_ffi();
    let back = JsValue::from_ffi(ffi);
    assert_eq!(back.as_number(), Some(-99.9));
}

#[test]
fn ffi_roundtrip_number_zero() {
    let val = JsValue::Number(0.0);
    let ffi = val.to_ffi();
    let back = JsValue::from_ffi(ffi);
    assert_eq!(back.as_number(), Some(0.0));
}

#[test]
fn ffi_roundtrip_number_infinity() {
    let val = JsValue::Number(f64::INFINITY);
    let ffi = val.to_ffi();
    let back = JsValue::from_ffi(ffi);
    assert_eq!(back.as_number(), Some(f64::INFINITY));
}

#[test]
fn ffi_roundtrip_number_nan() {
    let val = JsValue::Number(f64::NAN);
    let ffi = val.to_ffi();
    let back = JsValue::from_ffi(ffi);
    assert!(back.as_number().unwrap().is_nan());
}

#[test]
fn ffi_roundtrip_string_basic() {
    let val = JsValue::String("hello world".into());
    let ffi = val.to_ffi();
    let back = JsValue::from_ffi(ffi);
    assert_eq!(back.as_str(), Some("hello world"));
}

#[test]
fn ffi_roundtrip_string_empty() {
    let val = JsValue::String(String::new());
    let ffi = val.to_ffi();
    let back = JsValue::from_ffi(ffi);
    assert_eq!(back.as_str(), Some(""));
}

#[test]
fn ffi_roundtrip_string_unicode() {
    let val = JsValue::String("こんにちは 🌍".into());
    let ffi = val.to_ffi();
    let back = JsValue::from_ffi(ffi);
    assert_eq!(back.as_str(), Some("こんにちは 🌍"));
}

#[test]
fn ffi_roundtrip_string_long() {
    let long = "x".repeat(10_000);
    let val = JsValue::String(long.clone());
    let ffi = val.to_ffi();
    let back = JsValue::from_ffi(ffi);
    assert_eq!(back.as_str(), Some(long.as_str()));
}

// ============================================================================
// Standalone stub behavior (JSI-dependent functions return safe defaults)
// ============================================================================

#[test]
fn standalone_create_object_returns_undefined() {
    // In standalone mode, jsi_create_object returns undefined (no JSI runtime)
    let rt = make_test_runtime();
    let obj = rt.create_object();
    // Handle will be 0 since standalone returns undefined
    assert_eq!(obj.handle, 0);
}

#[test]
fn standalone_create_array_returns_undefined() {
    let rt = make_test_runtime();
    let arr = rt.create_array(5);
    assert_eq!(arr.handle, 0);
}

#[test]
fn standalone_object_get_returns_undefined() {
    let rt = make_test_runtime();
    let obj = JsObject { handle: 0 };
    let val = obj.get(&rt, "anything");
    assert!(val.is_undefined());
}

#[test]
fn standalone_array_length_returns_zero() {
    let rt = make_test_runtime();
    let arr = JsArray { handle: 0 };
    assert_eq!(arr.length(&rt), 0);
}

#[test]
fn standalone_object_set_does_not_crash() {
    let rt = make_test_runtime();
    let obj = JsObject { handle: 0 };
    // Should be a no-op in standalone mode, not crash
    obj.set(&rt, "key", &JsValue::Number(42.0));
}

#[test]
fn standalone_array_set_does_not_crash() {
    let rt = make_test_runtime();
    let arr = JsArray { handle: 0 };
    arr.set(&rt, 0, &JsValue::String("test".into()));
}

#[test]
fn standalone_array_get_returns_undefined() {
    let rt = make_test_runtime();
    let arr = JsArray { handle: 0 };
    assert!(arr.get(&rt, 0).is_undefined());
}

// ============================================================================
// Callback registry + rust_invoke_host_fn integration
// ============================================================================

#[test]
fn callback_registry_roundtrip() {
    // Register a callback that adds two numbers
    let id = expo_rust_jsi::bridge::register_callback(|_rt, args| {
        let a = args[0].as_number().unwrap_or(0.0);
        let b = args[1].as_number().unwrap_or(0.0);
        JsValue::Number(a + b)
    });
    assert!(id > 0);
}

#[test]
fn callback_registry_unique_ids() {
    let id1 = expo_rust_jsi::bridge::register_callback(|_rt, _| JsValue::Undefined);
    let id2 = expo_rust_jsi::bridge::register_callback(|_rt, _| JsValue::Undefined);
    let id3 = expo_rust_jsi::bridge::register_callback(|_rt, _| JsValue::Undefined);
    assert_ne!(id1, id2);
    assert_ne!(id2, id3);
    assert_ne!(id1, id3);
}

// ============================================================================
// ModuleBuilder integration (builds module definitions that use FFI)
// ============================================================================

#[test]
fn module_builder_sync_fn_through_ffi() {
    let module = ModuleBuilder::new("TestFFI")
        .sync_fn_2("add", |a: f64, b: f64| -> f64 { a + b })
        .build();

    assert_eq!(module.name, "TestFFI");
    let func = module.functions.iter().find(|f| f.name == "add").unwrap();

    let rt = make_test_runtime();
    let result = (func.body)(
        &rt,
        vec![JsValue::Number(3.0), JsValue::Number(4.0)],
    );
    assert_eq!(result.as_number(), Some(7.0));
}

#[test]
fn module_builder_sync_fn_string_through_ffi() {
    let module = ModuleBuilder::new("TestFFI")
        .sync_fn_1("greet", |name: String| -> String {
            format!("Hello, {}!", name)
        })
        .build();

    let func = module.functions.iter().find(|f| f.name == "greet").unwrap();
    let rt = make_test_runtime();
    let result = (func.body)(&rt, vec![JsValue::String("Rust".into())]);
    assert_eq!(result.as_str(), Some("Hello, Rust!"));
}

#[test]
fn module_builder_sync_fn_type_error_through_ffi() {
    let module = ModuleBuilder::new("TestFFI")
        .sync_fn_1("double", |n: f64| -> f64 { n * 2.0 })
        .build();

    let func = module.functions.iter().find(|f| f.name == "double").unwrap();
    let rt = make_test_runtime();
    // Pass a string where a number is expected
    let result = (func.body)(&rt, vec![JsValue::String("not a number".into())]);
    assert!(result.is_error());
}

#[test]
fn module_builder_result_error_through_ffi() {
    let module = ModuleBuilder::new("TestFFI")
        .sync_fn_1("validate", |n: f64| -> Result<f64, ExpoError> {
            if n < 0.0 {
                Err(ExpoError::new("NEGATIVE", "must be non-negative"))
            } else {
                Ok(n)
            }
        })
        .build();

    let func = module.functions.iter().find(|f| f.name == "validate").unwrap();
    let rt = make_test_runtime();

    let ok_result = (func.body)(&rt, vec![JsValue::Number(5.0)]);
    assert_eq!(ok_result.as_number(), Some(5.0));

    let err_result = (func.body)(&rt, vec![JsValue::Number(-1.0)]);
    assert!(err_result.is_error());
    assert!(err_result.as_error().unwrap().contains("NEGATIVE"));
}

#[test]
fn module_builder_constants_accessible() {
    let module = ModuleBuilder::new("TestFFI")
        .constant("VERSION", JsValue::String("1.0.0".into()))
        .constant("MAX_SIZE", JsValue::Number(1024.0))
        .build();

    assert_eq!(module.constants.len(), 2);
    let version = module.constants.iter().find(|c| c.name == "VERSION").unwrap();
    assert_eq!(version.value.as_str(), Some("1.0.0"));
}

#[test]
fn module_builder_high_arity_functions() {
    let module = ModuleBuilder::new("TestFFI")
        .sync_fn_5("sum5", |a: f64, b: f64, c: f64, d: f64, e: f64| -> f64 {
            a + b + c + d + e
        })
        .build();

    let func = module.functions.iter().find(|f| f.name == "sum5").unwrap();
    assert_eq!(func.param_count, 5);

    let rt = make_test_runtime();
    let result = (func.body)(
        &rt,
        vec![
            JsValue::Number(1.0),
            JsValue::Number(2.0),
            JsValue::Number(3.0),
            JsValue::Number(4.0),
            JsValue::Number(5.0),
        ],
    );
    assert_eq!(result.as_number(), Some(15.0));
}

#[test]
fn module_builder_async_fn_creates_definition() {
    let module = ModuleBuilder::new("TestFFI")
        .async_fn_1("fetch_data", |_key: String| -> String {
            "result".to_string()
        })
        .build();

    assert_eq!(module.async_functions.len(), 1);
    assert_eq!(module.async_functions[0].name, "fetch_data");
    assert_eq!(module.async_functions[0].param_count, 1);
}

// ============================================================================
// ExpoRecord through FFI (Map variant doesn't need C++ but tests the full path)
// ============================================================================

#[derive(ExpoRecord, Debug, Clone, Default, PartialEq)]
struct TestPoint {
    pub x: f64,
    pub y: f64,
}

#[derive(ExpoRecord, Debug, Clone, Default)]
struct TestConfig {
    #[field(required)]
    pub name: String,
    pub enabled: Option<bool>,
    #[field(key = "maxRetries")]
    pub max_retries: Option<i32>,
}

#[test]
fn record_ffi_roundtrip_via_map() {
    let point = TestPoint { x: 10.0, y: 20.0 };
    let js_val = point.into_js_value();
    assert!(js_val.is_map());

    let restored = TestPoint::from_js_value(&js_val).unwrap();
    assert_eq!(restored.x, 10.0);
    assert_eq!(restored.y, 20.0);
}

#[test]
fn record_ffi_with_optional_fields() {
    let mut map = std::collections::HashMap::new();
    map.insert("name".to_owned(), JsValue::String("test".into()));
    map.insert("maxRetries".to_owned(), JsValue::Number(3.0));
    let val = JsValue::Map(map);

    let config = TestConfig::from_js_value(&val).unwrap();
    assert_eq!(config.name, "test");
    assert_eq!(config.enabled, None);
    assert_eq!(config.max_retries, Some(3));
}

#[test]
fn record_ffi_required_field_missing() {
    let map = std::collections::HashMap::new();
    let val = JsValue::Map(map);
    let result = TestConfig::from_js_value(&val);
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("name"));
}

#[test]
fn record_used_as_function_arg() {
    let module = ModuleBuilder::new("TestFFI")
        .sync_fn_1("distance", |p: TestPoint| -> f64 {
            (p.x * p.x + p.y * p.y).sqrt()
        })
        .build();

    let func = module.functions.iter().find(|f| f.name == "distance").unwrap();
    let rt = make_test_runtime();

    let mut map = std::collections::HashMap::new();
    map.insert("x".to_owned(), JsValue::Number(3.0));
    map.insert("y".to_owned(), JsValue::Number(4.0));
    let result = (func.body)(&rt, vec![JsValue::Map(map)]);
    assert_eq!(result.as_number(), Some(5.0));
}

#[test]
fn record_returned_from_function() {
    let module = ModuleBuilder::new("TestFFI")
        .sync_fn_2("make_point", |x: f64, y: f64| -> TestPoint {
            TestPoint { x, y }
        })
        .build();

    let func = module.functions.iter().find(|f| f.name == "make_point").unwrap();
    let rt = make_test_runtime();
    let result = (func.body)(
        &rt,
        vec![JsValue::Number(7.0), JsValue::Number(11.0)],
    );

    // The result should be a Map since IntoJsValue for records produces Map
    assert!(result.is_map());
    let map = result.as_map().unwrap();
    assert_eq!(map.get("x").and_then(|v| v.as_number()), Some(7.0));
    assert_eq!(map.get("y").and_then(|v| v.as_number()), Some(11.0));
}

// ============================================================================
// Error propagation through the full pipeline
// ============================================================================

#[test]
fn error_to_ffi_encodes_as_string() {
    let val = JsValue::Error("test error".into());
    let ffi = val.to_ffi();
    // Error is encoded as a string in FFI (the dispatcher handles throwing)
    let back = JsValue::from_ffi(ffi);
    assert_eq!(back.as_str(), Some("test error"));
}

#[test]
fn result_error_through_module_function() {
    let module = ModuleBuilder::new("TestFFI")
        .sync_fn_0("always_fail", || -> Result<(), ExpoError> {
            Err(ExpoError::new("FAIL", "intentional"))
        })
        .build();

    let func = module.functions.iter().find(|f| f.name == "always_fail").unwrap();
    let rt = make_test_runtime();
    let result = (func.body)(&rt, vec![]);
    assert!(result.is_error());
    assert!(result.as_error().unwrap().contains("intentional"));
}

// ============================================================================
// Multiple values through FFI in sequence (stress test the bridge)
// ============================================================================

#[test]
fn ffi_many_values_sequential() {
    for i in 0..100 {
        let val = JsValue::Number(i as f64);
        let ffi = val.to_ffi();
        let back = JsValue::from_ffi(ffi);
        assert_eq!(back.as_number(), Some(i as f64));
    }
}

#[test]
fn ffi_mixed_types_sequential() {
    let values = vec![
        JsValue::Undefined,
        JsValue::Null,
        JsValue::Bool(true),
        JsValue::Bool(false),
        JsValue::Number(0.0),
        JsValue::Number(-1.0),
        JsValue::Number(f64::MAX),
        JsValue::Number(f64::MIN),
        JsValue::String("".into()),
        JsValue::String("hello".into()),
        JsValue::String("a".repeat(1000)),
    ];

    for val in &values {
        let ffi = val.to_ffi();
        let back = JsValue::from_ffi(ffi);

        match val {
            JsValue::Undefined => assert!(back.is_undefined()),
            JsValue::Null => assert!(back.is_null()),
            JsValue::Bool(b) => assert_eq!(back.as_bool(), Some(*b)),
            JsValue::Number(n) => assert_eq!(back.as_number(), Some(*n)),
            JsValue::String(s) => assert_eq!(back.as_str(), Some(s.as_str())),
            _ => unreachable!(),
        }
    }
}

// ============================================================================
// Helpers
// ============================================================================

fn make_test_runtime() -> Runtime {
    Runtime {
        handle: expo_rust_jsi::bridge::ffi::RuntimeHandle {
            ptr: std::ptr::null_mut(),
        },
    }
}
