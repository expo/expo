---
'@expo/image-utils': patch
---

Fix intermittent `Could not find MIME for Buffer <null>` errors when parallel image generation, such as the light and dark splash screens, reads a cached image while it is being written.
