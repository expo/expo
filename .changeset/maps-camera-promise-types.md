---
'expo-maps': patch
---

Correct `setCameraPosition` return types to `Promise<void>` on both platforms. On Android, callers can await animated camera moves and catch animation cancellation. On iOS, the promise resolves after scheduling the camera update, without waiting for the animation to finish. If the native view is unavailable, the methods return a resolved promise without moving the camera.
