---
'expo-screen-orientation': patch
---

[iOS] Invalidate the supported interface orientations before `lockAsync` requests the geometry update. The request no longer uses the previous mask, so the lock is applied after a JavaScript reload.
