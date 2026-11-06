---
'expo-location': patch
---

[Android] Fix `ConcurrentModificationException` crash when the activity pauses or resumes while location watchers are being registered. The resume now skips only the watcher that changed, so the other watchers still restart.