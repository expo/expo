---
'expo-modules-core': patch
---

[iOS] Fix a shared object that got two IDs when the main runtime and a worklet runtime paired it at the same time. Then `release()` in one runtime did not release the JS object in the other runtime.
