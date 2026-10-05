---
'expo-modules-jsi': patch
---

[iOS] Fix the xcframework failing to build with Xcode 26 (Swift 6.2): `RuntimeScheduler` constructors annotated with `SWIFT_RETURNS_RETAINED` were rejected, and host function and host object getter callbacks failed with `sending '...' risks causing data races`.
