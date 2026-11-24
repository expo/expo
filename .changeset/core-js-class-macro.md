---
'expo-modules-core': minor
---

[iOS] Update `expo-modules-macros` to 0.42.0 and add the `@JSClass` macro. `@JSClass` gives any class a JavaScript class, without making it a shared object. JavaScript creates an instance with `new`, which calls the `@JS init` of the class, and a `@JS` function can take the instance as an argument. List the class in `@ExpoModule(classes:)` to add it to the module. The hooks that core calls to build a JavaScript class move to the new `AnyJavaScriptClass` protocol, which `AnySharedObject` refines: `_decorateSharedObject` is now `_decorateClass`, `_constructSharedObject` is now `_constructInstance`, and the `_classTypes` of a module are now `[any AnyJavaScriptClass.Type]`. A prebuilt framework that defines a module must be built again with this version.
