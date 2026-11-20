---
'expo-modules-jsi': patch
---

[iOS] Fix `JavaScriptObject.defineProperty` with a string name, which kept an attribute of an existing property when the descriptor set that attribute to `false`. It also no longer clones the value of the property.
