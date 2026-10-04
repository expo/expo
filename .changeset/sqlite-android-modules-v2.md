---
'expo-sqlite': patch
---

[Android] Migrate to the Expo Modules API 2.0. Reloading the app now closes the databases that are still open, and `lastInsertRowId` is no longer truncated to 32 bits.
