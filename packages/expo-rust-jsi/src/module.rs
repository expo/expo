use crate::bridge::{ffi, register_callback};
use crate::value::{FromJsValue, IntoJsValue, JsValue, Runtime};
use std::collections::HashMap;

/// A function that can be called from JavaScript.
pub type NativeFn = Box<dyn Fn(&Runtime, Vec<JsValue>) -> JsValue + Send + Sync>;

/// Definition of a single module function.
pub struct FunctionDef {
    pub name: String,
    pub param_count: usize,
    pub body: NativeFn,
}

/// Definition of a module constant.
pub struct ConstantDef {
    pub name: String,
    pub value: JsValue,
}

/// Complete definition of an Expo module written in Rust.
pub struct ModuleDefinition {
    pub name: String,
    pub functions: Vec<FunctionDef>,
    pub constants: Vec<ConstantDef>,
    pub async_functions: Vec<FunctionDef>,
}

/// Builder for constructing a ModuleDefinition using a fluent API.
/// Mirrors the Kotlin/Swift DSL pattern.
pub struct ModuleBuilder {
    name: String,
    functions: Vec<FunctionDef>,
    constants: Vec<ConstantDef>,
    async_functions: Vec<FunctionDef>,
}

impl ModuleBuilder {
    pub fn new(name: &str) -> Self {
        Self {
            name: name.to_owned(),
            functions: Vec::new(),
            constants: Vec::new(),
            async_functions: Vec::new(),
        }
    }

    /// Register a synchronous function callable from JS.
    pub fn function<F>(mut self, name: &str, param_count: usize, body: F) -> Self
    where
        F: Fn(&Runtime, Vec<JsValue>) -> JsValue + Send + Sync + 'static,
    {
        self.functions.push(FunctionDef {
            name: name.to_owned(),
            param_count,
            body: Box::new(body),
        });
        self
    }

    /// Register a typed synchronous function with automatic argument conversion.
    /// Supports functions with 0-4 parameters.
    pub fn sync_fn_0<R, F>(self, name: &str, body: F) -> Self
    where
        R: IntoJsValue + 'static,
        F: Fn() -> R + Send + Sync + 'static,
    {
        self.function(name, 0, move |_rt, _args| body().into_js_value())
    }

    pub fn sync_fn_1<A0, R, F>(self, name: &str, body: F) -> Self
    where
        A0: FromJsValue + 'static,
        R: IntoJsValue + 'static,
        F: Fn(A0) -> R + Send + Sync + 'static,
    {
        self.function(name, 1, move |_rt, args| {
            let a0 = match A0::from_js_value(&args[0]) {
                Ok(v) => v,
                Err(e) => return JsValue::Error(format!("arg 0: {}", e)),
            };
            body(a0).into_js_value()
        })
    }

    pub fn sync_fn_2<A0, A1, R, F>(self, name: &str, body: F) -> Self
    where
        A0: FromJsValue + 'static,
        A1: FromJsValue + 'static,
        R: IntoJsValue + 'static,
        F: Fn(A0, A1) -> R + Send + Sync + 'static,
    {
        self.function(name, 2, move |_rt, args| {
            let a0 = match A0::from_js_value(&args[0]) {
                Ok(v) => v,
                Err(e) => return JsValue::Error(format!("arg 0: {}", e)),
            };
            let a1 = match A1::from_js_value(&args[1]) {
                Ok(v) => v,
                Err(e) => return JsValue::Error(format!("arg 1: {}", e)),
            };
            body(a0, a1).into_js_value()
        })
    }

    pub fn sync_fn_3<A0, A1, A2, R, F>(self, name: &str, body: F) -> Self
    where
        A0: FromJsValue + 'static,
        A1: FromJsValue + 'static,
        A2: FromJsValue + 'static,
        R: IntoJsValue + 'static,
        F: Fn(A0, A1, A2) -> R + Send + Sync + 'static,
    {
        self.function(name, 3, move |_rt, args| {
            let a0 = match A0::from_js_value(&args[0]) {
                Ok(v) => v,
                Err(e) => return JsValue::Error(format!("arg 0: {}", e)),
            };
            let a1 = match A1::from_js_value(&args[1]) {
                Ok(v) => v,
                Err(e) => return JsValue::Error(format!("arg 1: {}", e)),
            };
            let a2 = match A2::from_js_value(&args[2]) {
                Ok(v) => v,
                Err(e) => return JsValue::Error(format!("arg 2: {}", e)),
            };
            body(a0, a1, a2).into_js_value()
        })
    }

    pub fn sync_fn_4<A0, A1, A2, A3, R, F>(self, name: &str, body: F) -> Self
    where
        A0: FromJsValue + 'static,
        A1: FromJsValue + 'static,
        A2: FromJsValue + 'static,
        A3: FromJsValue + 'static,
        R: IntoJsValue + 'static,
        F: Fn(A0, A1, A2, A3) -> R + Send + Sync + 'static,
    {
        self.function(name, 4, move |_rt, args| {
            let a0 = match A0::from_js_value(&args[0]) {
                Ok(v) => v,
                Err(e) => return JsValue::Error(format!("arg 0: {}", e)),
            };
            let a1 = match A1::from_js_value(&args[1]) {
                Ok(v) => v,
                Err(e) => return JsValue::Error(format!("arg 1: {}", e)),
            };
            let a2 = match A2::from_js_value(&args[2]) {
                Ok(v) => v,
                Err(e) => return JsValue::Error(format!("arg 2: {}", e)),
            };
            let a3 = match A3::from_js_value(&args[3]) {
                Ok(v) => v,
                Err(e) => return JsValue::Error(format!("arg 3: {}", e)),
            };
            body(a0, a1, a2, a3).into_js_value()
        })
    }

    /// Register an async function. The callback receives a resolve/reject pair.
    pub fn async_function<F>(mut self, name: &str, param_count: usize, body: F) -> Self
    where
        F: Fn(&Runtime, Vec<JsValue>) -> JsValue + Send + Sync + 'static,
    {
        self.async_functions.push(FunctionDef {
            name: name.to_owned(),
            param_count,
            body: Box::new(body),
        });
        self
    }

    /// Register a constant value.
    pub fn constant<V: IntoJsValue>(mut self, name: &str, value: V) -> Self {
        self.constants.push(ConstantDef {
            name: name.to_owned(),
            value: value.into_js_value(),
        });
        self
    }

    /// Build the module definition.
    pub fn build(self) -> ModuleDefinition {
        ModuleDefinition {
            name: self.name,
            functions: self.functions,
            constants: self.constants,
            async_functions: self.async_functions,
        }
    }
}

/// Trait that Rust modules must implement.
///
/// This is the Rust equivalent of `expo.modules.kotlin.modules.Module` (Android)
/// or `Module` protocol (iOS).
///
/// Prefer using the `#[expo_module]` attribute macro which generates this
/// implementation automatically.
pub trait ExpoModule: Send + Sync {
    fn definition() -> ModuleDefinition;
}

/// Registry that holds all Rust-based Expo modules.
/// Modules register themselves here and get installed onto the JSI runtime.
pub struct ModuleRegistry {
    modules: HashMap<String, ModuleDefinition>,
}

impl ModuleRegistry {
    pub fn new() -> Self {
        Self {
            modules: HashMap::new(),
        }
    }

    /// Register a module type.
    pub fn register<M: ExpoModule>(&mut self) {
        let def = M::definition();
        self.modules.insert(def.name.clone(), def);
    }

    /// Register a pre-built module definition.
    pub fn register_definition(&mut self, def: ModuleDefinition) {
        self.modules.insert(def.name.clone(), def);
    }

    /// Install all registered modules onto the JSI runtime.
    /// Consumes self so function bodies can be moved into the callback registry.
    pub fn install(self, rt: &Runtime) {
        for (name, def) in self.modules {
            let obj = rt.create_object();

            // Install constants as properties
            for constant in &def.constants {
                obj.set(rt, &constant.name, &constant.value);
            }

            // Install sync functions as callable JSI host functions.
            // Each function is registered in the callback registry, then
            // a C++ host function is created that routes calls back to Rust.
            for func in def.functions {
                install_host_function(rt, &obj, func);
            }

            // Install async functions (same mechanism for now)
            for func in def.async_functions {
                install_host_function(rt, &obj, func);
            }

            // Register the module object into expo.modules
            ffi::jsi_register_module(&rt.handle, name.as_str(), obj.handle);
        }
    }
}

/// Create a real JSI host function backed by a Rust callback and attach
/// it as a property on the given JS object.
fn install_host_function(
    rt: &Runtime,
    obj: &crate::value::JsObject,
    func: FunctionDef,
) {
    let fn_name = func.name;
    let param_count = func.param_count;
    let body = func.body;

    // Move the function body into the callback registry.
    // When JS calls this function, C++ converts args to FfiValues,
    // calls rust_invoke_host_fn with this callback_id,
    // which looks up and invokes this closure.
    let callback_id = register_callback(move |rt_inner: &Runtime, args: Vec<JsValue>| {
        body(rt_inner, args)
    });

    // Create the JSI host function on the C++ side
    let fn_ffi = ffi::jsi_create_host_function(
        &rt.handle,
        &fn_name,
        param_count as u32,
        callback_id,
    );

    // Set the function as a property on the module object
    ffi::jsi_object_set_host_function(
        &rt.handle,
        obj.handle,
        &fn_name,
        fn_ffi.handle,
    );
}

impl Default for ModuleRegistry {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::value::ExpoError;

    #[test]
    fn test_module_builder_name() {
        let def = ModuleBuilder::new("TestModule").build();
        assert_eq!(def.name, "TestModule");
        assert!(def.functions.is_empty());
        assert!(def.constants.is_empty());
        assert!(def.async_functions.is_empty());
    }

    #[test]
    fn test_module_builder_constants() {
        let def = ModuleBuilder::new("Test")
            .constant("PI", 3.14_f64)
            .constant("NAME", "test")
            .constant("ENABLED", true)
            .build();

        assert_eq!(def.constants.len(), 3);
        assert_eq!(def.constants[0].name, "PI");
        assert!(matches!(def.constants[0].value, JsValue::Number(n) if (n - 3.14).abs() < f64::EPSILON));
        assert_eq!(def.constants[1].name, "NAME");
        assert!(matches!(&def.constants[1].value, JsValue::String(s) if s == "test"));
        assert_eq!(def.constants[2].name, "ENABLED");
        assert!(matches!(def.constants[2].value, JsValue::Bool(true)));
    }

    #[test]
    fn test_module_builder_sync_fn_0() {
        let def = ModuleBuilder::new("Test")
            .sync_fn_0::<f64, _>("get_pi", || std::f64::consts::PI)
            .build();

        assert_eq!(def.functions.len(), 1);
        assert_eq!(def.functions[0].name, "get_pi");
        assert_eq!(def.functions[0].param_count, 0);
    }

    #[test]
    fn test_module_builder_sync_fn_invocation() {
        let def = ModuleBuilder::new("Test")
            .sync_fn_2::<f64, f64, f64, _>("add", |a, b| a + b)
            .build();

        // Verify the function body can be called
        let rt = Runtime {
            handle: ffi::RuntimeHandle {
                ptr: std::ptr::null_mut(),
            },
        };
        let args = vec![JsValue::Number(2.0), JsValue::Number(3.0)];
        let result = (def.functions[0].body)(&rt, args);
        assert!(matches!(result, JsValue::Number(n) if n == 5.0));
    }

    #[test]
    fn test_module_builder_sync_fn_type_error() {
        let def = ModuleBuilder::new("Test")
            .sync_fn_1::<f64, f64, _>("sqrt", |x: f64| x.sqrt())
            .build();

        let rt = Runtime {
            handle: ffi::RuntimeHandle {
                ptr: std::ptr::null_mut(),
            },
        };
        // Pass wrong type — should get Error variant
        let args = vec![JsValue::String("not a number".into())];
        let result = (def.functions[0].body)(&rt, args);
        assert!(result.is_error());
    }

    #[test]
    fn test_module_builder_result_error_propagation() {
        let def = ModuleBuilder::new("Test")
            .sync_fn_1::<f64, JsValue, _>("safe_sqrt", |x: f64| -> JsValue {
                if x < 0.0 {
                    let err: ExpoError = ExpoError::new("MATH_ERROR", "cannot sqrt negative");
                    let result: Result<f64, ExpoError> = Err(err);
                    result.into_js_value()
                } else {
                    x.sqrt().into_js_value()
                }
            })
            .build();

        let rt = Runtime {
            handle: ffi::RuntimeHandle {
                ptr: std::ptr::null_mut(),
            },
        };

        // Positive — returns number
        let result = (def.functions[0].body)(&rt, vec![JsValue::Number(4.0)]);
        assert!(matches!(result, JsValue::Number(n) if n == 2.0));

        // Negative — returns error
        let result = (def.functions[0].body)(&rt, vec![JsValue::Number(-1.0)]);
        assert!(result.is_error());
        assert!(result.as_error().unwrap().contains("MATH_ERROR"));
    }

    #[test]
    fn test_module_builder_all_arities() {
        let def = ModuleBuilder::new("Test")
            .sync_fn_0::<f64, _>("f0", || 0.0)
            .sync_fn_1::<f64, f64, _>("f1", |a| a)
            .sync_fn_2::<f64, f64, f64, _>("f2", |a, b| a + b)
            .sync_fn_3::<f64, f64, f64, f64, _>("f3", |a, b, c| a + b + c)
            .sync_fn_4::<f64, f64, f64, f64, f64, _>("f4", |a, b, c, d| a + b + c + d)
            .build();

        assert_eq!(def.functions.len(), 5);
        assert_eq!(def.functions[0].param_count, 0);
        assert_eq!(def.functions[1].param_count, 1);
        assert_eq!(def.functions[2].param_count, 2);
        assert_eq!(def.functions[3].param_count, 3);
        assert_eq!(def.functions[4].param_count, 4);
    }

    #[test]
    fn test_module_registry() {
        let mut registry = ModuleRegistry::new();

        let def = ModuleBuilder::new("MyMod")
            .constant("VERSION", "1.0")
            .sync_fn_0::<f64, _>("zero", || 0.0)
            .build();

        registry.register_definition(def);
        assert!(registry.modules.contains_key("MyMod"));
    }
}
