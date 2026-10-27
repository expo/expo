---
'expo-modules-jsi': patch
---

[iOS] Add `JavaScriptObject.setProperty(_:encoding:in:)`, which encodes a value with `encode(_:into:in:)` straight into the engine value that the property is set to, and `JavaScriptValue.Slot.emplace(_:)` overloads for a `JavaScriptObject` and a `JavaScriptArray`. Setting a number, a boolean or a string property this way skips the intermediate `JavaScriptValue`.
