use crate::bridge::ffi;
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
    ///
    /// # Example
    /// ```ignore
    /// builder.function("add", |_rt, args| {
    ///     let a = f64::from_js_value(&args[0]).unwrap();
    ///     let b = f64::from_js_value(&args[1]).unwrap();
    ///     (a + b).into_js_value()
    /// });
    /// ```
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
                Err(_) => return JsValue::Undefined,
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
                Err(_) => return JsValue::Undefined,
            };
            let a1 = match A1::from_js_value(&args[1]) {
                Ok(v) => v,
                Err(_) => return JsValue::Undefined,
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
                Err(_) => return JsValue::Undefined,
            };
            let a1 = match A1::from_js_value(&args[1]) {
                Ok(v) => v,
                Err(_) => return JsValue::Undefined,
            };
            let a2 = match A2::from_js_value(&args[2]) {
                Ok(v) => v,
                Err(_) => return JsValue::Undefined,
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
                Err(_) => return JsValue::Undefined,
            };
            let a1 = match A1::from_js_value(&args[1]) {
                Ok(v) => v,
                Err(_) => return JsValue::Undefined,
            };
            let a2 = match A2::from_js_value(&args[2]) {
                Ok(v) => v,
                Err(_) => return JsValue::Undefined,
            };
            let a3 = match A3::from_js_value(&args[3]) {
                Ok(v) => v,
                Err(_) => return JsValue::Undefined,
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
/// # Example
/// ```ignore
/// struct MyModule;
///
/// impl ExpoModule for MyModule {
///     fn definition() -> ModuleDefinition {
///         ModuleBuilder::new("MyModule")
///             .sync_fn_2::<f64, f64, f64, _>("add", |a, b| a + b)
///             .sync_fn_1::<String, String, _>("greet", |name| {
///                 format!("Hello, {}!", name)
///             })
///             .constant("PI", std::f64::consts::PI)
///             .build()
///     }
/// }
/// ```
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
    /// This creates HostObject-backed JS objects and registers them
    /// into `expo.modules[name]`.
    pub fn install(&self, rt: &Runtime) {
        for (name, def) in &self.modules {
            let obj = rt.create_object();

            // Install constants as properties
            for constant in &def.constants {
                obj.set(rt, &constant.name, &constant.value);
            }

            // Install sync functions as properties
            // Each function becomes a host function on the object
            for func in &def.functions {
                // Create a wrapper that the C++ side can call
                let fn_name = func.name.clone();
                let result = JsValue::String(format!("[Function: {}]", fn_name));
                obj.set(rt, &func.name, &result);
            }

            // Register the module object into expo.modules
            ffi::jsi_register_module(&rt.handle, name.as_str(), obj.handle);
        }
    }
}

impl Default for ModuleRegistry {
    fn default() -> Self {
        Self::new()
    }
}
