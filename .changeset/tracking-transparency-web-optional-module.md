---
'expo-tracking-transparency': patch
---

[Web] Fix `Cannot find native module 'ExpoTrackingTransparency'` when the package is imported on web. `isAvailable()` now returns `false` on web.
