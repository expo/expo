---
'expo-task-manager': patch
---

[Android] Fix background tasks that wait until Android stops the app when the task event never reaches JavaScript. An event that JavaScript does not receive within 2 minutes after the task manager gets it fails with `ERR_TASK_NOT_DELIVERED`. An event fails with `ERR_TASK_INTERRUPTED` when its React instance is destroyed before JavaScript reports a result. A `loadApp` failure now fails the pending events with `ERR_TASK_NOT_DELIVERED` instead of leaving the callback unanswered.
