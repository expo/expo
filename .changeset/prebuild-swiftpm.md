---
'@expo/cli': patch
---

[iOS] Added a preview `experiments.swiftPackageManager` app config setting; when enabled, `expo prebuild` sets up iOS with Swift Package Manager instead of CocoaPods, and `expo run:ios` no longer runs `pod install`.
