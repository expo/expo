---
'expo-modules-autolinking': patch
---

[Internal] [iOS] Scan the Swift sources of packages with `scanPackages()` of `expo-modules-macros`, the new name of `scanModules()`. Fall back to `scanModules()` for `expo-modules-macros` 0.36.0 and older.
