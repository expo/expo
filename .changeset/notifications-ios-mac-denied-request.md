---
'expo-notifications': patch
---

[iOS] `requestPermissionsAsync` now resolves with the denied status, instead of rejecting with `ERR_PERMISSIONS_REQUEST_NOTIFICATIONS`, when the user denies the prompt in an iOS app on an Apple Silicon Mac ("Designed for iPad").
