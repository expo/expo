---
'expo-modules-jsi': patch
---

[iOS] Prepare for `JavaScriptValue` becoming a non-copyable struct in SDK 59. New: `JavaScriptValueRef`, a reference type for passing a value where only copyable types are accepted (containers, escaping closures, `Any`); `JavaScriptArray.forEachIndexed(_:)`; `JavaScriptPromise.resolve(_: JavaScriptValue)`; `JavaScriptValuesBuffer.copying(in:values: [JavaScriptValueRef])`. Deprecated, to be removed in SDK 59: `JavaScriptArray.init(_:items: [JavaScriptValue])`, its variadic form, `JavaScriptArray.enumerated()` and `JavaScriptValuesBuffer.copying(in:values: [JavaScriptValue])`. In SDK 59 `.undefined`/`.null` become `.undefined()`/`.null()`, `JavaScriptArray.filter` returns a `JavaScriptArray`, and owning a value read from a subscript such as `arguments[0]` needs `getValue(at:)` or `getProperty(_:)`.
