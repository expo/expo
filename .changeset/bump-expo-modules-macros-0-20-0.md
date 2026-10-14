---
'expo-modules-core': patch
---

[iOS] Update `expo-modules-macros` to 0.20.0, which binds `@JS` functions and setters that return nothing through the `Void` overload, so they no longer build an `undefined` value on each call.
