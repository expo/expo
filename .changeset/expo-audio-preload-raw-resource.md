---
'expo-audio': patch
---

[Android] Fix `preload()` rejecting with `FileNotFoundException` for bundled assets, for example after launching an update from `expo-updates`. `preload()` now resolves the source the same way as `createAudioPlayer()`.
