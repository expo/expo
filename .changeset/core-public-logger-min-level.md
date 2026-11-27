---
'expo-modules-core': patch
---

[iOS] Make `Logger.minLevel` public, so apps can keep less severe logs of the shared `log` instance, such as module registration in release builds, out of the device log.
