---
'expo-maps': patch
---

Correct `setCameraPosition` return types to `Promise<void>`. Android reports animation completion and cancellation; iOS resolves after scheduling the camera update.
