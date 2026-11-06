---
'expo-modules-jsi': patch
---

[iOS] Add `JavaScriptEncodable.encode(_:into:in:)`, which encodes a value straight into a `JavaScriptValue.Slot`. Numbers, booleans, strings and optionals construct the engine value in the slot, and `JavaScriptValuesBuffer.emplace(_:at:in:)` uses it, which reduces the overhead of passing these values as arguments to JavaScript functions.
