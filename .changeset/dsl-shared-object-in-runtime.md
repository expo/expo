---
'expo-modules-core': patch
---

[iOS] Fix a `Class` function or property that returned a shared object to a worklet runtime. It returned the JS object of the main runtime, not a JS object of the worklet runtime.
