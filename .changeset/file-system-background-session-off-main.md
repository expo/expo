---
'expo-file-system': patch
---

[iOS] Fix a crash on the first upload or download that uses a background session, including `UploadTask`, `File.upload()` and the legacy `uploadAsync` / `downloadAsync`.
