---
'expo-device': patch
---

[Android] Compute `deviceYearClass` without the `com.facebook.device.yearclass` library. On Android 12 and newer, a device with a known high-end chip now reports the year of that chip instead of at most 2016. Other devices use the same memory tiers as before. A device with 1.5 GB of memory or less and a slow CPU can report a year that is one higher than before. If your Android code uses the `yearclass` library through `expo-device`, add it to your own dependencies.
