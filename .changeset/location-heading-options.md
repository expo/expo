---
'expo-location': patch
---

Add `headingFilter` option to `watchHeadingAsync`, the minimum heading change in degrees between updates (`0` receives every reading). On iOS it maps to `CLLocationManager.headingFilter`, on Android it replaces the fixed ~2 degree gate. Heading events on iOS now also carry `headingAccuracy`, the accuracy in degrees, or `null` when the reading is invalid.
