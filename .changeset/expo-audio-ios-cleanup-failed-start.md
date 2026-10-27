---
'expo-audio': patch
---

[iOS] Fix `AudioStream` leaving its input tap installed and the audio engine allocated when starting the engine fails. The failed `start()` now removes the tap and stops the engine before rethrowing.
