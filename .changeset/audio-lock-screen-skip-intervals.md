---
'expo-audio': patch
---

Add `seekForwardIntervalSeconds` and `seekBackwardIntervalSeconds` to `AudioLockScreenOptions` to customize the lock screen skip intervals. Both default to 10 seconds and are clamped to at least 0.1 seconds.
