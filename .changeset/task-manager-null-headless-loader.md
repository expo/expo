---
'expo-task-manager': patch
---

[Android] Fix a `NullPointerException` in `TaskService.executeTask` when a task event (for example a background location update delivered by `JobScheduler`) arrives while the app is not loaded and the headless app loader is unavailable. The event now stays queued instead of crashing the app.
