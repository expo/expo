---
'expo-audio': patch
---

[Android] Fix `AudioStream` reading forever from a recorder that returned `ERROR_DEAD_OBJECT` or another error. The stream now stops, releases the recorder and emits `isStreaming: false`.
