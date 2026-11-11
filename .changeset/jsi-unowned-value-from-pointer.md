---
'expo-modules-jsi': patch
---

[iOS] Add `JavaScriptUnownedValue(_:unsafeValuePointer:)`, which borrows the `jsi::Value` at a raw pointer without copying it, and `JavaScriptObject.forEachProperty(_:)`, which iterates over the names and values of an object's enumerable properties.
