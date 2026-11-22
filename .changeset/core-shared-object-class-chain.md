---
'expo-modules-core': patch
---

[iOS] Make the JavaScript class of a shared object class extend the JavaScript class of its nearest superclass with the `@SharedObject` macro, which the new `_jsClassType` and `_jsParentClassType` hooks give. A class whose hooks give no parent extends `SharedObject` or `SharedRef`, as before. The hooks of the macro are now requirements of `AnySharedObject`, which `SharedObject` implements.
