---
'expo-image': patch
---

[iOS] Fixed a `CALayerInvalidGeometry` crash when an image decodes to a size of `0x0` and `contentFit` is `cover` or `contain`.
