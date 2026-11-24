---
'expo-modules-jsi': patch
---

[iOS] Added `trySetNativeState(_:)` to `JavaScriptObject`. It returns `false` when the engine doesn't allow a native state on the object, for example when the object is frozen, a Proxy or a host object. Added `withUnsafePointee(_:)` to `JavaScriptPropNameID`, so code that calls C++ can pass a cached property name.
