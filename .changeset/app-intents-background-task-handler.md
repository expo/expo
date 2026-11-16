---
'expo-app-intents': patch
---

[iOS] Add `AppIntentDispatcher.runBackgroundTask(name:params:timeout:)`, which runs a JavaScript task defined with `TaskManager.defineTask` from an intent's `perform()` and returns the value the task resolved with. It requires `expo-task-manager`.
