---
'expo-modules-core': patch
---

[iOS] Fix a crash when several concurrent functions read `appContext.fileSystem` or `appContext.permissions` for the first time at once, such as parallel `openDatabaseAsync` calls in `expo-sqlite`.
