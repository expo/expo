---
'expo-dev-launcher': patch
---

[Android] Fix the "App react context shouldn't be created before" crash when a reload request arrives while the launcher opens an app. The reload is ignored, because the app that opens loads the latest bundle.
