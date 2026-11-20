---
'expo-modules-jsi': patch
---

[iOS] Make `JavaScriptFunction` conform to `JavaScriptCodable`, so a `@JS` function can take and return it. Decoding a value that is not a function throws a `TypeError`. Add `JavaScriptFunction.takeValue()` and `JavaScriptUnownedValue.getFunction(in:)` and `asFunction(in:)`.
