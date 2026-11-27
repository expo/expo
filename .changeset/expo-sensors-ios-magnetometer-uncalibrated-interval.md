---
'expo-sensors': patch
---

[iOS] Fix `MagnetometerUncalibrated.setUpdateInterval()` using the interval in milliseconds as seconds. Before this fix, the listener received only the first reading.
