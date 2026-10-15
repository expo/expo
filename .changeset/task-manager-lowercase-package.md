---
'expo-task-manager': patch
---

[android] Rename the Java package from `expo.modules.taskManager` to `expo.modules.taskmanager` to match the Gradle namespace. This fixes an R8 `BuildConfig` descriptor error on case-insensitive file systems.
