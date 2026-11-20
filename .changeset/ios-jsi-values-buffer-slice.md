---
'expo-modules-jsi': patch
---

[iOS] Add `JavaScriptValuesBuffer.slice(_:)` to pass a range of values on without copying them, and make `JavaScriptObject.getNativeState(as:)` inlinable so its cast is specialized in the caller.
