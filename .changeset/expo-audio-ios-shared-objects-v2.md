---
'expo-audio': patch
---

[iOS] Migrate `AudioPlayer` and `AudioPlaylist` to the Expo Modules API 2.0. The player status now always includes `mediaServicesDidReset`, which is `false` until the system resets media services.
