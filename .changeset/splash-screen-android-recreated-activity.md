---
'expo-splash-screen': patch
---

[Android] Keep the splash screen on an activity that is recreated in a live process when the app called `preventAutoHideAsync`, instead of showing an empty window until React mounts.
