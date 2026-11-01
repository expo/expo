---
'expo-task-manager': patch
---

[Android] Fix JS timers, and anything built on them such as `fetch()`, hanging in background tasks on React Native 0.86 and later. The headless task that keeps timers alive no longer finishes as soon as it starts.
