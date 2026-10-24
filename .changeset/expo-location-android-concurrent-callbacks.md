---
'expo-location': patch
---

[Android] Fix `ConcurrentModificationException` crash when the activity pauses or resumes while location watchers are being registered.