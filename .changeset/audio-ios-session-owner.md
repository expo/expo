---
'expo-audio': patch
---

[iOS] Add `setAudioSessionOwner()` and a `deactivateSession` argument to `AudioPlayer.pause()`, so pausing audio can hand the shared audio session to another module, such as `expo-video`, without deactivating it.
