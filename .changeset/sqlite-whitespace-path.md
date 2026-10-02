---
'expo-sqlite': patch
---

[iOS] Fixed opening databases in directories whose path contains whitespace or non-ASCII characters, and fixed `importDatabaseFromAssetAsync` with `forceOverwrite` failing on repeat calls.
