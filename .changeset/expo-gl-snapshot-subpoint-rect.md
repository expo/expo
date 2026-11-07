---
'expo-gl': patch
---

[iOS] Fix `GLView.takeSnapshotAsync` crashing when `rect` is smaller than one point, and saving an image smaller than `rect` when its size is not a multiple of the screen scale.
