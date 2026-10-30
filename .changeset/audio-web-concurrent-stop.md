---
'expo-audio': patch
---

[Web] Make every `stop()` call on a recorder wait for the stop that is in progress. A second `stop()` during a stop no longer rejects with "Cannot start an audio recording without initializing a MediaRecorder".
