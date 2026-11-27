---
'expo-file-system': patch
---

[iOS] Fix upload task and download task progress sending `bytesSent`, `bytesWritten` and `totalBytes` as `bigint` instead of `number`.
