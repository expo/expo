---
'expo-modules-jsi': patch
---

[iOS] Remove `JavaScriptNativeState.init(factory:)` and `JavaScriptNativeState.Factory`. A `JavaScriptNativeState` always gets a plain C++ `expo::NativeState`. Use `setDeallocator(_:)` to run code when the native state is no longer attached to any JS object.
