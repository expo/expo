---
'expo-modules-jsi': patch
'expo-modules-core': patch
'expo-brownfield': patch
---

[iOS] Make `JavaScriptValue` a non-copyable struct. This is a breaking change for Swift code that uses `JavaScriptValue` directly:

- Values are moved, not shared. Pass them as `borrowing` or `consuming` parameters, and call `copy()` where a second owned value is needed.
- `JavaScriptValue.undefined` and `JavaScriptValue.null` are functions now: write `.undefined()` and `.null()`.
- A `JavaScriptValue` can no longer be an argument or a result of a `Function`, `AsyncFunction`, `Property` or `Field` definition. Declare the function with the `@JS` macro instead (in an `@ExpoModule` or `@SharedObject` class) and take the value as `borrowing JavaScriptValue`, or use a typed argument.
- To keep a value in an array, an escaping closure or another place that takes copyable types only, wrap it with `value.ref()` and read it back with `take()` or `withUnwrappedValue(_:)`.
- `JavaScriptArray.init(_:items:)`, `JavaScriptArray.enumerated()`, `JavaScriptArray.filter(_:)` and `JavaScriptValuesBuffer.copying(in:values:)` with an array of values are removed. Use the parameter pack initializer, `forEach`, `forEachIndexed`, `reduce`, or the `[JavaScriptValue.Ref]` overload.
