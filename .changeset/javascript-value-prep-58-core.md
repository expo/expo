---
'expo-modules-core': patch
---

[iOS] Prepare for `JavaScriptValue` becoming a non-copyable struct in SDK 59: `JavaScriptValueRef` conforms to `AnyArgument`, so a DSL `Function` argument, `Field` or `Promise.resolve` value can be declared as `JavaScriptValueRef` ahead of the change, and the internals no longer rely on the value being a class.
