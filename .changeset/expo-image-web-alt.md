---
'expo-image': patch
---

[Web] Fix `alt` not reaching the loaded image. It was only applied to the placeholder, so the rendered `<img>` had no `alt` attribute once the image loaded.
