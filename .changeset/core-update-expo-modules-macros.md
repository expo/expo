---
'expo-modules-core': patch
---

[iOS] Update `expo-modules-macros` to 0.23.1. `@JS` now supports a `lazy var`, which is read-only from JavaScript and stores its value on the JavaScript object at the first read. `@SharedObject` now supports subclasses of `SharedRef<T>`. Macros in a generic type no longer fail to build when a generic parameter of the type has the same name as one in the generated code.
