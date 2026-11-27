---
'expo-modules-core': minor
---

[iOS] Update `expo-modules-macros` to 0.42.0 and add the `@JSClass` macro, which gives a JavaScript class to a class that isn't a shared object. This breaks the ABI, so a prebuilt framework that defines a module must be built again.
