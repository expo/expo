---
'expo-audio': patch
---

[Web] Make `stop()` resolve and release the microphone when a prepared recorder never started. Before, `stop()` stayed pending and the browser kept the microphone in use.
