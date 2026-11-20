---
'expo-modules-jsi': patch
---

[iOS] Add `JavaScriptObject.defineLazyProperty(_:options:factory:)`, which defines a property whose value is created on the first read. That read replaces the property with a data property that holds the value.
