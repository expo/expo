---
'expo-gl': patch
---

[Android] Fix a crash at launch in release builds with R8. `GLView` failed with `Didn't find a correct constructor for class ...`. `expo-gl` now ships ProGuard rules that keep the `GLView` constructor and `GLContext.flush()`.
