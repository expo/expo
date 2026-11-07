---
'expo-gl': patch
---

[Android] Fix a crash when a `GLView` surface is destroyed before its context is ready. `onSurfaceCreate` no longer reports the destroyed context, so `GLView` no longer throws `Cannot set property '__expoSetLogging' of undefined`.
