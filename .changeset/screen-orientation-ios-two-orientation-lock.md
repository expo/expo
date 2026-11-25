---
'expo-screen-orientation': patch
---

[iOS] Fix `getOrientationAsync()` returning `UNKNOWN` after `lockAsync(OrientationLock.LANDSCAPE)` rotates the screen, and returning `PORTRAIT_UP` after the next `unlockAsync()` while the screen stays in landscape.
