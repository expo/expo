use proc_macro::TokenStream;
use quote::{format_ident, quote};
use syn::{
    parse::{Parse, ParseStream},
    parse_macro_input, Attribute, FnArg, ImplItem, ImplItemFn, ItemImpl, LitStr, Pat, ReturnType,
    Type,
};

/// Attribute macro that transforms an `impl` block into an Expo module definition.
///
/// Place `#[expo_module("ModuleName")]` on an impl block. Each method becomes
/// a synchronous JS function by default. Use inner attributes to customize:
///
/// - `#[constant]` — registers the method as a constant (called once at init)
/// - `#[async_fn]` — registers as an async JS function
///
/// The macro generates an `ExpoModule` trait implementation that builds the
/// module using `ModuleBuilder`.
///
/// # Example
///
/// ```rust,ignore
/// use expo_rust_jsi::prelude::*;
///
/// struct MathModule;
///
/// #[expo_module("RustMath")]
/// impl MathModule {
///     #[constant]
///     const PI: f64 = std::f64::consts::PI;
///
///     #[constant]
///     const E: f64 = std::f64::consts::E;
///
///     fn add(a: f64, b: f64) -> f64 {
///         a + b
///     }
///
///     fn sqrt(x: f64) -> f64 {
///         x.sqrt()
///     }
///
///     #[async_fn]
///     async fn fetch_data(url: String) -> String {
///         // ...
///     }
/// }
/// ```
///
/// This expands roughly to:
///
/// ```rust,ignore
/// impl MathModule {
///     fn add(a: f64, b: f64) -> f64 { a + b }
///     fn sqrt(x: f64) -> f64 { x.sqrt() }
/// }
///
/// impl ExpoModule for MathModule {
///     fn definition() -> ModuleDefinition {
///         ModuleBuilder::new("RustMath")
///             .constant("PI", std::f64::consts::PI)
///             .constant("E", std::f64::consts::E)
///             .sync_fn_2::<f64, f64, f64, _>("add", |a, b| MathModule::add(a, b))
///             .sync_fn_1::<f64, f64, _>("sqrt", |x| MathModule::sqrt(x))
///             .build()
///     }
/// }
/// ```
#[proc_macro_attribute]
pub fn expo_module(attr: TokenStream, item: TokenStream) -> TokenStream {
    let module_name = parse_macro_input!(attr as LitStr).value();
    let input = parse_macro_input!(item as ItemImpl);

    let struct_type = &input.self_ty;

    let mut constants = Vec::new();
    let mut sync_fns = Vec::new();
    let mut async_fns = Vec::new();
    let mut retained_items: Vec<ImplItem> = Vec::new();

    for item in &input.items {
        match item {
            // Handle `#[constant] const NAME: Type = expr;`
            ImplItem::Const(c) => {
                if has_attr(&c.attrs, "constant") {
                    let name = c.ident.to_string();
                    let expr = &c.expr;
                    constants.push(quote! {
                        .constant(#name, #expr)
                    });
                }
                // Keep the const in the impl block (without the #[constant] attr)
                let mut cleaned = c.clone();
                cleaned.attrs.retain(|a| !is_attr(a, "constant"));
                retained_items.push(ImplItem::Const(cleaned));
            }
            // Handle methods
            ImplItem::Fn(method) => {
                let is_constant = has_attr(&method.attrs, "constant");
                let is_async = has_attr(&method.attrs, "async_fn");

                if is_constant {
                    let fn_name = &method.sig.ident;
                    let js_name = fn_name.to_string();
                    constants.push(quote! {
                        .constant(#js_name, #struct_type::#fn_name())
                    });
                } else {
                    let parsed = match parse_fn(method) {
                        Ok(p) => p,
                        Err(e) => return e.to_compile_error().into(),
                    };

                    if is_async {
                        async_fns.push(parsed);
                    } else {
                        sync_fns.push(parsed);
                    }
                }

                // Keep the method in the impl block (stripped of our attrs)
                let mut cleaned = method.clone();
                cleaned
                    .attrs
                    .retain(|a| !is_attr(a, "constant") && !is_attr(a, "async_fn"));
                retained_items.push(ImplItem::Fn(cleaned));
            }
            other => {
                retained_items.push(other.clone());
            }
        }
    }

    // Generate builder calls for sync functions
    let sync_fn_calls: Vec<_> = sync_fns
        .iter()
        .map(|f| {
            let js_name = &f.name;
            let param_types = &f.param_types;
            let ret_type = &f.ret_type;
            let param_names = &f.param_names;
            let fn_ident = &f.fn_ident;
            let arity = param_types.len();
            let sync_fn_ident = format_ident!("sync_fn_{}", arity);

            quote! {
                .#sync_fn_ident::<#(#param_types,)* #ret_type, _>(#js_name, |#(#param_names),*| {
                    #struct_type::#fn_ident(#(#param_names),*)
                })
            }
        })
        .collect();

    // Generate builder calls for async functions
    let async_fn_calls: Vec<_> = async_fns
        .iter()
        .map(|f| {
            let js_name = &f.name;
            let param_types = &f.param_types;
            let param_names = &f.param_names;
            let fn_ident = &f.fn_ident;
            let arity = param_types.len();

            quote! {
                .async_function(#js_name, #arity, move |_rt, args| {
                    // TODO: Full async support with typed parameters
                    #struct_type::#fn_ident(
                        #(
                            <#param_types as FromJsValue>::from_js_value(&args[{ let i: usize = 0; i }]).unwrap()
                        ),*
                    ).into_js_value()
                })
            }
        })
        .collect();

    // Reconstruct the impl block with cleaned items
    let (impl_generics, _, where_clause) = input.generics.split_for_impl();
    let vis_attrs = &input.attrs;

    let expanded = quote! {
        #(#vis_attrs)*
        impl #impl_generics #struct_type #where_clause {
            #(#retained_items)*
        }

        impl ExpoModule for #struct_type {
            fn definition() -> ModuleDefinition {
                ModuleBuilder::new(#module_name)
                    #(#constants)*
                    #(#sync_fn_calls)*
                    #(#async_fn_calls)*
                    .build()
            }
        }
    };

    TokenStream::from(expanded)
}

struct ParsedFn {
    name: String,
    fn_ident: syn::Ident,
    param_names: Vec<syn::Ident>,
    param_types: Vec<Box<Type>>,
    ret_type: Box<Type>,
}

fn parse_fn(method: &ImplItemFn) -> syn::Result<ParsedFn> {
    let fn_ident = method.sig.ident.clone();
    let name = fn_ident.to_string();

    let mut param_names = Vec::new();
    let mut param_types = Vec::new();

    for arg in &method.sig.inputs {
        match arg {
            FnArg::Receiver(_) => {
                return Err(syn::Error::new_spanned(
                    arg,
                    "#[expo_module] functions must not take &self",
                ));
            }
            FnArg::Typed(pat_type) => {
                let ident = match pat_type.pat.as_ref() {
                    Pat::Ident(pi) => pi.ident.clone(),
                    _ => {
                        return Err(syn::Error::new_spanned(
                            &pat_type.pat,
                            "expected a simple parameter name",
                        ))
                    }
                };
                param_names.push(ident);
                param_types.push(pat_type.ty.clone());
            }
        }
    }

    let ret_type: Box<Type> = match &method.sig.output {
        ReturnType::Default => {
            syn::parse2(quote! { () })?
        }
        ReturnType::Type(_, ty) => ty.clone(),
    };

    Ok(ParsedFn {
        name,
        fn_ident,
        param_names,
        param_types,
        ret_type,
    })
}

fn has_attr(attrs: &[Attribute], name: &str) -> bool {
    attrs.iter().any(|a| is_attr(a, name))
}

fn is_attr(attr: &Attribute, name: &str) -> bool {
    attr.path().is_ident(name)
}
