---
'expo-file-system': patch
---

[iOS] Fix a crash on the first transfer that uses a background session: `UploadTask`, `File.upload()` and the legacy `downloadAsync`, `uploadAsync`, `createUploadTask` and `createDownloadResumable`.
