---
'expo-image': patch
---

[Android] Decode still AVIF images with Glide's AVIF decoder instead of the animated image decoder, which only handles animated AVIFs now. Fixes `blurRadius` and other transformations being ignored on AVIF images, and an ANR where the main thread could wait forever while an AVIF image loaded.
