---
'expo-modules-jsi': patch
---

[iOS] Add `JavaScriptCallback.invokeDetached(_:argumentCount:emplacing:)`, `invokeBlocking(_:argumentCount:emplacing:)` and `invokeBlocking(_:argumentCount:returning:emplacing:)`, which take the arguments as one value and a closure that encodes each one with the new `JavaScriptValuesBuffer.emplace(_:at:in:)`. `JavaScriptValuesBuffer.allocate(in:capacity:)` now fills its values with `undefined`.
