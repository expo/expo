---
'expo-modules-jsi': patch
---

[iOS] Add `JavaScriptArray.mapUnowned(_:)`, `JavaScriptObject.withUnownedProperty(_:_:)`, and `isArray()` and `getArray(in:)` on `JavaScriptUnownedValue`. Arrays, dictionaries and dates now decode through their unowned overload without copying the value or wrapping each element in a `JavaScriptValue`, and their owning decodes forward to it.
