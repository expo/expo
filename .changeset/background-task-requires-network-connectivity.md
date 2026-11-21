---
'expo-background-task': patch
---

Add a `requiresNetworkConnectivity` option to `BackgroundTaskOptions`, so tasks that do only local work can run while the device is offline. It defaults to `true`, which is the current behavior.
