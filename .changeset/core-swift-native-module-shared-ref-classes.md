---
'expo-modules-core': patch
---

[iOS] Install the `expo.NativeModule` and `expo.SharedRef` classes from Swift. `expo.NativeModule` now inherits the static members of `expo.EventEmitter`, and `expo.SharedRef` inherits the static members of `expo.SharedObject`. Removed `-[EXJavaScriptRuntimeManager installSharedRefClass]` and `-[EXJavaScriptRuntimeManager installNativeModuleClass]`.
