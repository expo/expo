---
'@expo/ui': patch
---

[Android] Fix `Icon` and `Image` drawing a vector drawable resource shifted or clipped when it uses `<group>` transforms, clip paths or gradients. Drawables referenced by resource name are now inflated by Compose.
