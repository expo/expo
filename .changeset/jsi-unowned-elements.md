---
'expo-modules-jsi': patch
'expo-modules-core': patch
---

[iOS] Add `JavaScriptArray.mapUnowned(_:)` and `JavaScriptObject.withUnownedProperty(_:_:)`, which lend elements and properties out as `JavaScriptUnownedValue`s. Arrays and dictionaries now decode their elements through them, without a `JavaScriptValue` per element, and their owning decodes, like those of records and enums, forward to the unowned ones.
