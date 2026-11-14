---
'expo-audio': patch
---

[Android] Playback no longer requests audio focus when `interruptionMode` is unset, matching the documented `mixWithOthers` default, so it no longer pauses for phone calls or other apps. Set `interruptionMode` to `doNotMix` or `duckOthers` to keep that behavior.
