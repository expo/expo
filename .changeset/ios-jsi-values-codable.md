---
'expo-modules-jsi': patch
---

[iOS] Make `JavaScriptBigInt`, `JavaScriptSymbol`, `JavaScriptArrayBuffer` and `JavaScriptTypedArray` conform to `JavaScriptCodable`, so a `@JS` function can take and return them. Decoding a value of another kind throws a `TypeError`. Add `takeValue()` to these types and `asBigInt(in:)`, `asSymbol(in:)`, `asArrayBuffer(in:)` and `asTypedArray(in:)` to `JavaScriptUnownedValue`.

[iOS] `JavaScriptValue.isArray()`, `isFunction()`, `isTypedArray()` and `isArrayBuffer()` return `false` for a value without a runtime, such as `JavaScriptValue.number(_:)`, instead of stopping the app. Decoding such a value as one of these types throws a `TypeError`.
