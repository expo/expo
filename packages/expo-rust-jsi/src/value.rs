use crate::bridge::ffi::{self, FfiValue, RuntimeHandle, ValueKind};

/// A JavaScript value that can be passed to/from native Rust code.
#[derive(Debug, Clone)]
pub enum JsValue {
    Undefined,
    Null,
    Bool(bool),
    Number(f64),
    String(String),
    Object(JsObject),
    Array(JsArray),
}

/// Handle to a JavaScript object living in the JSI runtime.
#[derive(Debug, Clone)]
pub struct JsObject {
    pub(crate) handle: u64,
}

/// Handle to a JavaScript array living in the JSI runtime.
#[derive(Debug, Clone)]
pub struct JsArray {
    pub(crate) handle: u64,
}

/// A reference to the JSI runtime, required for object/array operations.
pub struct Runtime {
    pub(crate) handle: RuntimeHandle,
}

// ---- JsValue conversions ----

impl JsValue {
    pub(crate) fn from_ffi(ffi: FfiValue) -> Self {
        match ffi.kind {
            ValueKind::Undefined => JsValue::Undefined,
            ValueKind::Null => JsValue::Null,
            ValueKind::Boolean => JsValue::Bool(ffi.bool_val),
            ValueKind::Number => JsValue::Number(ffi.number_val),
            ValueKind::String => JsValue::String(ffi.string_val.clone()),
            ValueKind::Object => JsValue::Object(JsObject { handle: ffi.handle }),
            ValueKind::Array => JsValue::Array(JsArray { handle: ffi.handle }),
            _ => JsValue::Undefined,
        }
    }

    pub(crate) fn to_ffi(&self) -> FfiValue {
        match self {
            JsValue::Undefined => ffi::jsi_make_undefined(),
            JsValue::Null => ffi::jsi_make_null(),
            JsValue::Bool(v) => ffi::jsi_make_bool(*v),
            JsValue::Number(v) => ffi::jsi_make_number(*v),
            JsValue::String(s) => ffi::jsi_make_string(s.as_str()),
            JsValue::Object(obj) => FfiValue {
                kind: ValueKind::Object,
                bool_val: false,
                number_val: 0.0,
                string_val: String::new(),
                handle: obj.handle,
            },
            JsValue::Array(arr) => FfiValue {
                kind: ValueKind::Array,
                bool_val: false,
                number_val: 0.0,
                string_val: String::new(),
                handle: arr.handle,
            },
        }
    }

    pub fn is_undefined(&self) -> bool {
        matches!(self, JsValue::Undefined)
    }
    pub fn is_null(&self) -> bool {
        matches!(self, JsValue::Null)
    }
    pub fn is_bool(&self) -> bool {
        matches!(self, JsValue::Bool(_))
    }
    pub fn is_number(&self) -> bool {
        matches!(self, JsValue::Number(_))
    }
    pub fn is_string(&self) -> bool {
        matches!(self, JsValue::String(_))
    }
    pub fn is_object(&self) -> bool {
        matches!(self, JsValue::Object(_))
    }
    pub fn is_array(&self) -> bool {
        matches!(self, JsValue::Array(_))
    }

    pub fn as_bool(&self) -> Option<bool> {
        match self {
            JsValue::Bool(v) => Some(*v),
            _ => None,
        }
    }
    pub fn as_number(&self) -> Option<f64> {
        match self {
            JsValue::Number(v) => Some(*v),
            _ => None,
        }
    }
    pub fn as_str(&self) -> Option<&str> {
        match self {
            JsValue::String(s) => Some(s.as_str()),
            _ => None,
        }
    }
    pub fn as_object(&self) -> Option<&JsObject> {
        match self {
            JsValue::Object(o) => Some(o),
            _ => None,
        }
    }
    pub fn as_array(&self) -> Option<&JsArray> {
        match self {
            JsValue::Array(a) => Some(a),
            _ => None,
        }
    }
}

// ---- Trait for types that can be converted to/from JsValue ----

/// Types that can be converted to a JavaScript value.
pub trait IntoJsValue {
    fn into_js_value(self) -> JsValue;
}

/// Types that can be extracted from a JavaScript value.
pub trait FromJsValue: Sized {
    fn from_js_value(value: &JsValue) -> Result<Self, String>;
}

// ---- Blanket implementations ----

impl IntoJsValue for () {
    fn into_js_value(self) -> JsValue {
        JsValue::Undefined
    }
}

impl IntoJsValue for bool {
    fn into_js_value(self) -> JsValue {
        JsValue::Bool(self)
    }
}

impl IntoJsValue for f64 {
    fn into_js_value(self) -> JsValue {
        JsValue::Number(self)
    }
}

impl IntoJsValue for i32 {
    fn into_js_value(self) -> JsValue {
        JsValue::Number(self as f64)
    }
}

impl IntoJsValue for i64 {
    fn into_js_value(self) -> JsValue {
        JsValue::Number(self as f64)
    }
}

impl IntoJsValue for u32 {
    fn into_js_value(self) -> JsValue {
        JsValue::Number(self as f64)
    }
}

impl IntoJsValue for String {
    fn into_js_value(self) -> JsValue {
        JsValue::String(self)
    }
}

impl IntoJsValue for &str {
    fn into_js_value(self) -> JsValue {
        JsValue::String(self.to_owned())
    }
}

impl IntoJsValue for JsValue {
    fn into_js_value(self) -> JsValue {
        self
    }
}

impl<T: IntoJsValue> IntoJsValue for Vec<T> {
    fn into_js_value(self) -> JsValue {
        // Vec<T> gets converted to a JsValue::Array at registration time
        // For now, we represent it as an array of converted values
        // The actual JSI array creation happens in the module builder
        JsValue::Undefined // Placeholder - real arrays created via Runtime
    }
}

impl<T: IntoJsValue> IntoJsValue for Option<T> {
    fn into_js_value(self) -> JsValue {
        match self {
            Some(v) => v.into_js_value(),
            None => JsValue::Null,
        }
    }
}

impl FromJsValue for bool {
    fn from_js_value(value: &JsValue) -> Result<Self, String> {
        value.as_bool().ok_or_else(|| "expected boolean".into())
    }
}

impl FromJsValue for f64 {
    fn from_js_value(value: &JsValue) -> Result<Self, String> {
        value.as_number().ok_or_else(|| "expected number".into())
    }
}

impl FromJsValue for i32 {
    fn from_js_value(value: &JsValue) -> Result<Self, String> {
        value.as_number().map(|n| n as i32).ok_or_else(|| "expected number".into())
    }
}

impl FromJsValue for i64 {
    fn from_js_value(value: &JsValue) -> Result<Self, String> {
        value.as_number().map(|n| n as i64).ok_or_else(|| "expected number".into())
    }
}

impl FromJsValue for String {
    fn from_js_value(value: &JsValue) -> Result<Self, String> {
        value.as_str().map(|s| s.to_owned()).ok_or_else(|| "expected string".into())
    }
}

impl FromJsValue for JsValue {
    fn from_js_value(value: &JsValue) -> Result<Self, String> {
        Ok(value.clone())
    }
}

impl<T: FromJsValue> FromJsValue for Option<T> {
    fn from_js_value(value: &JsValue) -> Result<Self, String> {
        if value.is_null() || value.is_undefined() {
            Ok(None)
        } else {
            T::from_js_value(value).map(Some)
        }
    }
}

// ---- JsObject operations ----

impl JsObject {
    pub fn set(&self, rt: &Runtime, name: &str, value: &JsValue) {
        let ffi_val = value.to_ffi();
        ffi::jsi_object_set_property(&rt.handle, self.handle, name, &ffi_val);
    }

    pub fn get(&self, rt: &Runtime, name: &str) -> JsValue {
        JsValue::from_ffi(ffi::jsi_object_get_property(&rt.handle, self.handle, name))
    }
}

// ---- JsArray operations ----

impl JsArray {
    pub fn set(&self, rt: &Runtime, index: u32, value: &JsValue) {
        let ffi_val = value.to_ffi();
        ffi::jsi_array_set_value(&rt.handle, self.handle, index, &ffi_val);
    }

    pub fn get(&self, rt: &Runtime, index: u32) -> JsValue {
        JsValue::from_ffi(ffi::jsi_array_get_value(&rt.handle, self.handle, index))
    }

    pub fn length(&self, rt: &Runtime) -> u32 {
        ffi::jsi_array_length(&rt.handle, self.handle)
    }
}

// ---- Runtime operations ----

impl Runtime {
    pub fn create_object(&self) -> JsObject {
        let ffi = ffi::jsi_create_object(&self.handle);
        JsObject { handle: ffi.handle }
    }

    pub fn create_array(&self, length: u32) -> JsArray {
        let ffi = ffi::jsi_create_array(&self.handle, length);
        JsArray { handle: ffi.handle }
    }
}
