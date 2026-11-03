---
'expo-modules-jsi': patch
---

[iOS] Add `JavaScriptSymbol`, which creates symbols, reads `Symbol.for` and the well-known symbols, and converts to and from `JavaScriptValue`. Add `JavaScriptValue.getSymbol()`, `JavaScriptValue.asSymbol()`, `JavaScriptUnownedValue.getSymbol(in:)` and `JavaScriptPropNameID(_:symbol:)`, so symbols can be property keys.
