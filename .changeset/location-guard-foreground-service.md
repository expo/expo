---
"expo-location": patch
---

[Android] Don't crash when the foreground service of a location task can't be started, for example when the location permission was revoked while the task stayed registered. The task now keeps running without the service instead of crashing the app on every launch.
