---
'expo-location': patch
---

[Android] Reject `geocodeAsync` and `reverseGeocodeAsync` when the geocoder fails on Android 13+ instead of leaving the promise pending forever.
