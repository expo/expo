---
"expo-task-manager": patch
---

[Android] Fix `TaskService` losing its `Context` (it held a `WeakReference` to the creating `ReactContext`), after which registering or unregistering a task threw a `NullPointerException` from `SharedPreferences.getAll()`.
