---
'expo-audio': patch
---

[Android] Fix `prepareToRecordAsync` failing after 5 seconds with background recording enabled when the recording service connects before `bindService` returns.
