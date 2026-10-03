---
'expo-modules-core': patch
---

[iOS] Native views now get their app context from the host that mounts them, so each view is registered in React Native once per process instead of once per app context. Reloads no longer create new view classes, and the view names no longer have the app identifier suffix.
