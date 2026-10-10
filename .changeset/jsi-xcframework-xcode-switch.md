---
'expo-modules-jsi': patch
---

[iOS] Fix the `ExpoModulesJSI` xcframework slice staying built against another Xcode's SDK. The slice cache now includes the Xcode build, so switching between Xcode releases that share a Swift compiler (such as Xcode 27.0 and 27.1) rebuilds it, and the rebuild uses the app build's `DEVELOPER_DIR` instead of the Xcode selected with `xcode-select`.
