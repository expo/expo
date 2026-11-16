---
'expo-modules-core': patch
---

[iOS] Update `expo-modules-macros` to 0.27.1, which binds sync `@JS` functions that return nothing through the `Void` host function overload. This reduces the overhead of calling them.
