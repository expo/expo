---
'expo-image': patch
---

Fix images laying out as `0x0` when the size is declared by the source (an asset loaded with `require` or a `width`/`height` on the `ImageSource`) and not by the style.
