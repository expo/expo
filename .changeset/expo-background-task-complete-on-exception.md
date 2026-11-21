---
'expo-background-task': patch
---

[Android] Fix the background worker waiting forever when a task consumer throws before it registers its completion callback. The worker now logs the error code and message when a task finishes with an error.
