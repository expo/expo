---
'expo-location': patch
---

[iOS] Fix `requestBackgroundPermissions` in the `next` API resolving `denied` while the "Change to Always Allow" prompt is still on screen when it is called right after `requestForegroundPermissions`. The request now waits until the app is active before it asks.
