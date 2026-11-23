---
'expo-location': patch
---

Add a `timeout` option to `getMotionActivityAsync` that rejects with `ERR_LOCATION_MOTION_ACTIVITY_TIMEOUT` when no activity update arrives in time.
