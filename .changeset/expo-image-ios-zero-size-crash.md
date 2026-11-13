---
'expo-image': patch
---

[iOS] Fix a `CALayerInvalidGeometry` crash when an image decodes to a size of `0x0` and `contentFit` is `cover` or `contain`.

Images with no pixels now use the container size for layout in every `contentFit` mode, including `none` and `scale-down`, which previously used a zero size.
