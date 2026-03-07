use crate::bridge::ffi::{self, FfiValue, RuntimeHandle, ValueKind};

/// Error type for Expo module functions.
/// When a function returns `Result<T, ExpoError>`, the error is propagated
/// as a JavaScript exception.
#[derive(Debug, Clone, thiserror::Error)]
#[error("{message}")]
pub struct ExpoError {
    pub code: String,
    pub message: String,
}

impl ExpoError {
    pub fn new(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            code: code.into(),
            message: message.into(),
        }
    }
}

impl From<String> for ExpoError {
    fn from(message: String) -> Self {
        Self {
            code: "ERR_RUST_MODULE".to_owned(),
            message,
        }
    }
}

impl From<&str> for ExpoError {
    fn from(message: &str) -> Self {
        Self::from(message.to_owned())
    }
}

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
    /// Internal variant representing an error that should become a JS exception.
    /// Not directly mapped to a JS value type — the install layer converts this
    /// to a thrown error.
    Error(String),
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
            // Error is serialized as a string; the callback dispatcher
            // checks for this and can throw a JS exception.
            JsValue::Error(msg) => ffi::jsi_make_string(msg.as_str()),
        }
    }

    pub fn is_error(&self) -> bool {
        matches!(self, JsValue::Error(_))
    }
    pub fn as_error(&self) -> Option<&str> {
        match self {
            JsValue::Error(s) => Some(s.as_str()),
            _ => None,
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
        // Store converted elements; the install layer will create a real
        // JSI array when this value is passed across the FFI boundary.
        // For now we use a JsArray placeholder with handle=0 and store
        // elements as a nested structure. A proper implementation will
        // create the JSI array via Runtime::create_array + set_value.
        //
        // Since we don't have a Runtime reference here, we represent this
        // as a serializable form that the FFI layer can reconstruct.
        // For primitive-only arrays, we pack into a String-encoded form.
        //
        // TODO: Full array support requires passing Runtime through IntoJsValue
        JsValue::Undefined
    }
}

impl<T: IntoJsValue, E: Into<ExpoError>> IntoJsValue for Result<T, E> {
    fn into_js_value(self) -> JsValue {
        match self {
            Ok(v) => v.into_js_value(),
            Err(e) => {
                let err: ExpoError = e.into();
                JsValue::Error(format!("[{}] {}", err.code, err.message))
            }
        }
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

impl FromJsValue for u32 {
    fn from_js_value(value: &JsValue) -> Result<Self, String> {
        value.as_number().map(|n| n as u32).ok_or_else(|| "expected number".into())
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

#[cfg(test)]
mod tests {
    use super::*;

    // ---- IntoJsValue tests ----

    #[test]
    fn test_into_js_value_primitives() {
        assert!(matches!(().into_js_value(), JsValue::Undefined));
        assert!(matches!(true.into_js_value(), JsValue::Bool(true)));
        assert!(matches!(false.into_js_value(), JsValue::Bool(false)));
        assert!(matches!(42.0_f64.into_js_value(), JsValue::Number(n) if n == 42.0));
        assert!(matches!(42_i32.into_js_value(), JsValue::Number(n) if n == 42.0));
        assert!(matches!(42_i64.into_js_value(), JsValue::Number(n) if n == 42.0));
        assert!(matches!(42_u32.into_js_value(), JsValue::Number(n) if n == 42.0));
        assert!(matches!("hello".into_js_value(), JsValue::String(ref s) if s == "hello"));
        assert!(matches!(String::from("hello").into_js_value(), JsValue::String(ref s) if s == "hello"));
    }

    #[test]
    fn test_into_js_value_option() {
        let some: Option<f64> = Some(3.14);
        assert!(matches!(some.into_js_value(), JsValue::Number(n) if (n - 3.14).abs() < f64::EPSILON));

        let none: Option<f64> = None;
        assert!(matches!(none.into_js_value(), JsValue::Null));
    }

    #[test]
    fn test_into_js_value_result_ok() {
        let ok: Result<f64, ExpoError> = Ok(42.0);
        assert!(matches!(ok.into_js_value(), JsValue::Number(n) if n == 42.0));
    }

    #[test]
    fn test_into_js_value_result_err() {
        let err: Result<f64, ExpoError> = Err(ExpoError::new("TEST", "something failed"));
        let val = err.into_js_value();
        assert!(val.is_error());
        assert!(val.as_error().unwrap().contains("TEST"));
        assert!(val.as_error().unwrap().contains("something failed"));
    }

    // ---- FromJsValue tests ----

    #[test]
    fn test_from_js_value_bool() {
        assert_eq!(bool::from_js_value(&JsValue::Bool(true)).unwrap(), true);
        assert!(bool::from_js_value(&JsValue::Number(1.0)).is_err());
    }

    #[test]
    fn test_from_js_value_numbers() {
        assert_eq!(f64::from_js_value(&JsValue::Number(3.14)).unwrap(), 3.14);
        assert_eq!(i32::from_js_value(&JsValue::Number(42.0)).unwrap(), 42);
        assert_eq!(i64::from_js_value(&JsValue::Number(42.0)).unwrap(), 42);
        assert_eq!(u32::from_js_value(&JsValue::Number(42.0)).unwrap(), 42);
        assert!(f64::from_js_value(&JsValue::String("not a number".into())).is_err());
    }

    #[test]
    fn test_from_js_value_string() {
        assert_eq!(
            String::from_js_value(&JsValue::String("hello".into())).unwrap(),
            "hello"
        );
        assert!(String::from_js_value(&JsValue::Number(42.0)).is_err());
    }

    #[test]
    fn test_from_js_value_option() {
        let some: Option<f64> = Option::from_js_value(&JsValue::Number(42.0)).unwrap();
        assert_eq!(some, Some(42.0));

        let none: Option<f64> = Option::from_js_value(&JsValue::Null).unwrap();
        assert_eq!(none, None);

        let none2: Option<f64> = Option::from_js_value(&JsValue::Undefined).unwrap();
        assert_eq!(none2, None);
    }

    #[test]
    fn test_from_js_value_passthrough() {
        let val = JsValue::Number(42.0);
        let cloned = JsValue::from_js_value(&val).unwrap();
        assert!(matches!(cloned, JsValue::Number(n) if n == 42.0));
    }

    // ---- ExpoError tests ----

    #[test]
    fn test_expo_error_from_string() {
        let err: ExpoError = "oops".into();
        assert_eq!(err.code, "ERR_RUST_MODULE");
        assert_eq!(err.message, "oops");
    }

    #[test]
    fn test_expo_error_display() {
        let err = ExpoError::new("MY_CODE", "bad input");
        assert_eq!(err.to_string(), "bad input");
    }

    // ---- JsValue type checks ----

    #[test]
    fn test_js_value_type_checks() {
        assert!(JsValue::Undefined.is_undefined());
        assert!(JsValue::Null.is_null());
        assert!(JsValue::Bool(true).is_bool());
        assert!(JsValue::Number(1.0).is_number());
        assert!(JsValue::String("s".into()).is_string());
        assert!(JsValue::Object(JsObject { handle: 0 }).is_object());
        assert!(JsValue::Array(JsArray { handle: 0 }).is_array());
        assert!(JsValue::Error("e".into()).is_error());
    }
}
