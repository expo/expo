---
'expo-background-task': patch
---

[Android] Fix the background task never running on minified release builds, because R8 removed the WorkManager input merger constructor.
