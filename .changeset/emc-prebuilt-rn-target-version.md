---
'expo-modules-core': patch
---

[iOS] Define `REACT_NATIVE_TARGET_VERSION` in the precompiled `ExpoModulesCore`, so it sends view size updates with `unstable_Immediate` and keeps the size-commit budget, like a source build.
