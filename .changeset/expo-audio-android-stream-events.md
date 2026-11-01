---
'expo-audio': patch
---

[Android] Fix `AudioStream` status events reporting the state at delivery time instead of the state when `start()` or `stop()` was called, and stop delivering PCM buffers from a stopped stream after it restarts.
