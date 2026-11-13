---
'expo-audio': patch
---

[iOS] Fix `AudioStream` emitting non-interleaved samples for multichannel input, and throw instead of emitting Float32 samples when the requested format cannot be converted.
