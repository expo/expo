---
'expo-modules-core': patch
---

[iOS] `expo.EventEmitter` is implemented in Swift, so modules, shared objects, and objects that JS creates keep their event listeners in one store. A listener that `expo.EventEmitter.prototype.addListener` adds to a shared object now gets the native events of the shared object.
