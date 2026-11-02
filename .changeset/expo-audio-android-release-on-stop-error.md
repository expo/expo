---
'expo-audio': patch
---

[Android] Fix `AudioStream` leaking its `AudioRecord` when stopping the recorder throws. The recorder is now released in every case and the stream still emits its status and finalizes file recording.
