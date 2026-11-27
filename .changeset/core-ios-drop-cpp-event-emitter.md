---
'expo-modules-core': patch
---

[iOS] Build only the Fabric files of `common/cpp` on iOS. The other C++ files (the `EventEmitter`, `SharedObject`, `SharedRef`, `NativeModule` and `LazyObject` classes and the JSI helpers) are for Android only, and their headers are no longer in the iOS pod. Removed `EXJavaScriptRuntimeManager`.
