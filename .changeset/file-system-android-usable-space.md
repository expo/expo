---
'expo-file-system': patch
---

[Android] Fix `Paths.availableDiskSpace` returning space reserved for the system. It now returns the space the app can use.
