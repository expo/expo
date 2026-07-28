---
'expo-location': minor
---

Add `altitudeAboveMeanSeaLevel` to `LocationObjectCoords`. `altitude` on iOS now returns the WGS 84 ellipsoidal altitude, matching Android. [Android] `altitudeAccuracy` is `null` instead of `undefined` when unavailable.
