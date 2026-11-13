---
'expo-file-system': patch
---

[iOS] Fix a crash when a `DownloadTask` or `UploadTask` is cancelled or garbage-collected at the moment its request completes.
