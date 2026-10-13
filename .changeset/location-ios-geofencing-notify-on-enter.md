---
'expo-location': patch
---

[iOS] Fix `notifyOnEnter` being ignored for geofencing regions. The native side read a misspelled key, so every region reported enter events regardless of the flag.
