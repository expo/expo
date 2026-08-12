---
'expo-image': patch
---

Document that the default `cachePolicy` of `'disk'` does not use the memory cache, so every mount of the same image reads and decodes it from the disk again.
