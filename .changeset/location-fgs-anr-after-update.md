---
'expo-location': patch
---

[Android] Fix background location tasks that stop delivering updates after an app update, and the `Context.startForegroundService() did not then call Service.startForeground()` ANR that goes with them. The foreground service now enters the foreground from `onStartCommand` instead of from the asynchronous service connection, and a service that could not be started while the app was in the background is started when the app is resumed.
