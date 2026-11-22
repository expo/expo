---
'expo-modules-core': patch
---

[iOS] Update `expo-modules-macros` to 0.41.0. The JavaScript class of a `@SharedObject` class now extends the JavaScript class of its nearest superclass with the macro, so its instances are `instanceof` that class, and the members of the superclass are on the prototype of the superclass only. The macro gives the superclass to core with the new `_jsClassType` and `_jsSuperclassType` hooks, which are requirements of `AnySharedObject` with the other hooks of the macro.
