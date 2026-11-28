---
'expo-splash-screen': patch
---

[Android] Fix the `SurfaceControl.checkNotReleased` crash at startup on Android 12 and 13 by not setting the splash exit animation listener on these versions. The system still plays its own exit animation there; only the configured `duration` is not applied.
