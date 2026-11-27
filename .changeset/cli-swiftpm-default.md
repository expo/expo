---
'@expo/cli': major
---

Use Swift Package Manager for iOS by default in `expo prebuild`. Set `"ios": { "useCocoaPods": true }` in the app config to keep CocoaPods. Projects with React Native older than 0.88 fall back to CocoaPods with a warning. Prebuild without `--clean` stops with an error when CocoaPods is installed in the existing **ios** directory and `ios.useCocoaPods` is not set. `experiments.swiftPackageManager` is removed and only logs a warning. `expo run:ios` skips CocoaPods when the iOS project uses Swift Package Manager.
