---
'expo-modules-cli': patch
---

Read the `scan-exports` schema of `expo-modules-macros` 0.42.0, which `expo-modules-core` depends on. `typegen` declares a `@JSClass` class as a class without a base class, and resolves the types that refer to it.
