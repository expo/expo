---
'expo': minor
---

[iOS] Add an overridable `initialProperties` to `ExpoAppSceneDelegate`, restoring the root properties apps could pass through `RCTAppDelegate.initialProps` before React Native moved its startup into `scene(_:willConnectTo:)`. Apps that seed properties there — such as the `isHeadless` flag `react-native-firebase` reads to detect a background launch — had no way to supply them under the scene life cycle. The default is `nil`, so apps that pass nothing are unaffected.
