---
"expo-audio": patch
---

[Android] Fix `prepareToRecordAsync()` hanging forever when background recording is enabled and the recording service never connects. The binding timeout is now started, and the promise also rejects when the React context is lost.
