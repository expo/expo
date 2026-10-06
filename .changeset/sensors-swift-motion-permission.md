---
'expo-sensors': patch
---

[iOS] Rewrote the motion permission requester in Swift. When `NSMotionUsageDescription` is missing from the app's Info.plist, the requester now logs an error and reports the permission as denied, instead of raising a fatal React Native error (and, on request, querying CoreMotion, which made iOS terminate the app).
