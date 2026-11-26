---
'expo-task-manager': patch
---

[iOS] Fixed an `EXC_BAD_ACCESS` crash in `EXTaskService` when a task finishes on another thread while a launch, such as an `expo-background-task` background launch, is still starting its tasks.
