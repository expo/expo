---
'expo-location': patch
---

[iOS] Fix `requestBackgroundPermissionsAsync` resolving `denied` while the "Change to Always Allow" prompt is still on screen when it is called right after `requestForegroundPermissionsAsync`. The request now waits until the app is active before it asks.
