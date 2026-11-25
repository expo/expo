---
'expo-image': patch
---

[Android] Stop `Image.prefetch` with the `disk` and `memory-disk` cache policies from decoding the full-size image. It now only downloads the image to the disk cache.
