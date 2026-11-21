---
'expo-audio': patch
---

[Android] Fix the lock screen media session missing most player events, such as timeline and track changes. Moving an `AudioPlaylist` to a track added after `setActiveForLockScreen` crashed the app with `Invalid PlayerInfo update`.
