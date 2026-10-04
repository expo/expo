---
'expo-audio': patch
---

[iOS][Android] Fixed recorders that the user paused starting to record again when the app returned to the foreground. On iOS, this also happened to recorders that were only prepared, and when an audio interruption ended. Now only recordings that the system paused are resumed.
