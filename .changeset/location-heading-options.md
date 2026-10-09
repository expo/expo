---
'expo-location': patch
---

Add options to `watchHeadingAsync`: `headingFilter` controls the minimum heading change in degrees that triggers an update (iOS maps to `CLLocationManager.headingFilter`, `-1` delivers every reading; Android replaces the fixed ~2 degree gate, `0` leaves only the time rate limit), and every heading event now carries `headingAccuracy` with the raw numeric accuracy: degrees on iOS, the sensor accuracy status on Android.
