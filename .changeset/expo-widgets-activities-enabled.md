---
'expo-widgets': patch
---

[iOS] Add `areActivitiesEnabled()`, which returns whether the user allows the app to start Live Activities, so an app can check before calling `start()` instead of catching its error.
