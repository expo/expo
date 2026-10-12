---
"expo-location": patch
---

[iOS] Fix geofencing restarting a failed region in an unbounded loop, for example with more than 20 regions. Fix `notifyOnEnter: false` being ignored.
