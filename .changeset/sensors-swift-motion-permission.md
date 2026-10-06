---
'expo-sensors': patch
---

[iOS] Rewrote the motion permission requester in Swift, so expo-sensors no longer needs a separate Objective-C target when built with Swift Package Manager. Fixed a crash when `NSMotionUsageDescription` is missing from Info.plist: the permission is now reported as denied and an error is logged.
