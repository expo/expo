---
'expo-modules-core': patch
---

[iOS] Add the `.inline` and `.blocking` options of `@Event` and the `emitInline` and `emitBlocking` methods of `EventEmitter` that they use. With `.inline`, the listeners run before the call returns when it is made on the JavaScript thread. With `.blocking`, they run before the call returns on any thread.
