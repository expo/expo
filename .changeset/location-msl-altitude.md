---
'expo-location': minor
---

Add `mslAltitude` to `LocationObjectCoords`. `altitude` on iOS now returns the WGS 84 ellipsoidal altitude, matching Android. `altitude`, `mslAltitude` and `altitudeAccuracy` are `null` instead of `0` or `undefined` when the platform reports no valid altitude.
