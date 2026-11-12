---
"@expo/image-utils": patch
---

Fix detection of the `sharp` instance installed with `sharp-cli`, so image generation uses `sharp` instead of always falling back to Jimp.
