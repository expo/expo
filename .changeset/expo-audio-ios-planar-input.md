---
'expo-audio': patch
---

[iOS] Fix `AudioStream` emitting wrong PCM for non-interleaved multichannel input, and throw from `start()` instead of silently streaming a different sample format when the requested conversion is unavailable.
