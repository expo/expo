---
'expo-maps': patch
---

[Android] Fix `isMyLocationEnabled` crashing the app with a `SecurityException` when the location permission has not been granted. The prop is now a request that is ignored without the permission, matching iOS.
