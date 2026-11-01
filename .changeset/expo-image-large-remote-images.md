---
'expo-image': patch
---

[Android] Fix images larger than 5 MB that failed to load with `cachePolicy` set to `none` or `memory`, or with `Image.prefetch` and the `memory` cache policy. On Android 8.1 and newer, a static PNG or WebP file larger than 5 MB still needs the disk cache, because Glide reads the whole file for its EXIF orientation.
