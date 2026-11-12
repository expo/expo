---
"expo-task-manager": patch
---

[iOS] Fix crashes (use-after-free) and duplicated completions when a background task finishes on another thread while the task service is still evaluating its execution request, for example at the end of a background processing task.
