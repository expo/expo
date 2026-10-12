---
'expo-modules-jsi': patch
'expo-modules-core': patch
---

[iOS] Read the properties of a typed array through property names cached per runtime, which makes `JavaScriptValue.getTypedArray()` about twice as fast. `getTypedArray()` is now isolated to `JavaScriptActor`, like `asTypedArray()`.
