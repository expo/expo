---
'expo-image-picker': patch
---

[Android] Fix `launchImageLibraryAsync` rejecting the whole selection when a video has no width, height, rotation or duration metadata, and release `MediaMetadataRetriever` after use.
