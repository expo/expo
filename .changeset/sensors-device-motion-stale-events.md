---
'expo-sensors': patch
---

[Android] Fixed `DeviceMotion` emitting a stale reading from the previous subscription when re-subscribing, and sensors restarting after the last listener was removed when the app returned to the foreground.
