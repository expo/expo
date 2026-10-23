---
'expo-task-manager': patch
---

[Android] Fix background tasks that wait until Android stops the app when the task event never reaches JavaScript. An event that JavaScript does not receive in 2 minutes fails with `ERR_TASK_NOT_DELIVERED`. An event fails with `ERR_TASK_INTERRUPTED` when its React instance is destroyed before JavaScript reports a result. The headless task that keeps JavaScript timers alive for each event ends after 10 minutes.
