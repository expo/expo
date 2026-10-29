---
'expo-audio': patch
---

Fix `setAudioModeAsync` resetting the fields that a partial mode leaves out. Omitted fields now keep their current values. For example, `setAudioModeAsync({ allowsBackgroundRecording: true })` disabled `playsInSilentMode` on Android, so players stopped in vibrate and silent ringer modes.
