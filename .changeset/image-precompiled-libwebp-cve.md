---
'expo-image': patch
---

[iOS] Fix the precompiled WebP coder linking libwebp 1.1.0, which is affected by CVE-2023-4863. It now links libwebp 1.6.0, and source builds require libwebp 1.3.2 or later.
