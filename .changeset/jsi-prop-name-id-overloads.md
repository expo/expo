---
'expo-modules-jsi': patch
---

[iOS] Add `JavaScriptObject.setProperty(_:value:)` and `JavaScriptObject.withUnownedProperty(_:_:)` overloads that take a `JavaScriptPropNameID`. `JavaScriptPropNameID.init(_:string:)` now borrows the runtime, so code that only borrows a runtime can create property names without copying it.
