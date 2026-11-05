---
'expo-device': patch
---

[Android] Compute `deviceYearClass` without the `com.facebook.device.yearclass` library. The memory and CPU tiers are the same. A device that declares a media performance class now reports the year of that class, from 2020 on, instead of at most 2016. If your Android code uses the `yearclass` library through `expo-device`, add it to your own dependencies.
