---
'expo-splash-screen': patch
---

[Android] Fix the `SurfaceControl.checkNotReleased` crash at startup on Android 12 and 13 by not setting the splash exit animation listener on these versions. The splash screen hides without the fade there.
