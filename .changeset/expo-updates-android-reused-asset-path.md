---
'expo-updates': patch
---

[Android] Fix assets that fail to load after an app update renames an embedded resource. When expo-updates reuses an existing asset row, it now saves the new asset path on that row.
