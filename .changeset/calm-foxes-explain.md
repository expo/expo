---
'expo-doctor': patch
---

Fixed `expo-doctor` dependency checks failing with `EBADDEVENGINES` in projects whose `devEngines.packageManager` is not npm.
