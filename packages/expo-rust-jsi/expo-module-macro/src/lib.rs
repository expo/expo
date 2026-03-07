use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput, ItemFn, LitStr};

/// Derive macro that implements `ExpoModule` for a struct based on its
/// method attributes.
///
/// # Example
///
/// ```rust,ignore
/// use expo_rust_jsi::prelude::*;
/// use expo_module_macro::expo_module;
///
/// #[expo_module(name = "RustMath")]
/// struct MathModule;
///
/// #[expo_module_impl]
/// impl MathModule {
///     #[expo_fn]
///     fn add(a: f64, b: f64) -> f64 {
///         a + b
///     }
///
///     #[expo_fn]
///     fn multiply(a: f64, b: f64) -> f64 {
///         a * b
///     }
///
///     #[expo_const]
///     fn pi() -> f64 {
///         std::f64::consts::PI
///     }
/// }
/// ```
#[proc_macro_attribute]
pub fn expo_module(attr: TokenStream, item: TokenStream) -> TokenStream {
    let input = parse_macro_input!(item as DeriveInput);
    let struct_name = &input.ident;

    // Parse the module name from attributes
    let module_name = if attr.is_empty() {
        struct_name.to_string()
    } else {
        let name_str = parse_macro_input!(attr as ModuleNameAttr).name;
        name_str
    };

    let expanded = quote! {
        #input

        impl #struct_name {
            /// Returns the module name for JSI registration.
            pub const MODULE_NAME: &'static str = #module_name;
        }
    };

    TokenStream::from(expanded)
}

/// Attribute for impl blocks that marks methods as expo functions.
///
/// Methods marked with `#[expo_fn]` become synchronous JS functions.
/// Methods marked with `#[expo_async_fn]` become async JS functions.
/// Methods marked with `#[expo_const]` become module constants.
#[proc_macro_attribute]
pub fn expo_module_impl(_attr: TokenStream, item: TokenStream) -> TokenStream {
    // For now, pass through. The real work happens in the individual
    // method attributes. A full implementation would parse the impl block
    // and generate the ExpoModule trait implementation.
    item
}

/// Marks a function as an expo sync function.
#[proc_macro_attribute]
pub fn expo_fn(_attr: TokenStream, item: TokenStream) -> TokenStream {
    item
}

/// Marks a function as an expo async function.
#[proc_macro_attribute]
pub fn expo_async_fn(_attr: TokenStream, item: TokenStream) -> TokenStream {
    item
}

/// Marks a function as providing an expo constant.
#[proc_macro_attribute]
pub fn expo_const(_attr: TokenStream, item: TokenStream) -> TokenStream {
    item
}

// Internal: parse `name = "ModuleName"` from attribute
struct ModuleNameAttr {
    name: String,
}

impl syn::parse::Parse for ModuleNameAttr {
    fn parse(input: syn::parse::ParseStream) -> syn::Result<Self> {
        let ident: syn::Ident = input.parse()?;
        if ident != "name" {
            return Err(syn::Error::new(ident.span(), "expected `name`"));
        }
        let _: syn::Token![=] = input.parse()?;
        let lit: LitStr = input.parse()?;
        Ok(ModuleNameAttr {
            name: lit.value(),
        })
    }
}
