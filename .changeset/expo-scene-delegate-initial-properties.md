---
'expo': minor
---

[iOS] Add an overridable `initialProperties` to `ExpoAppSceneDelegate`, restoring the root properties apps could pass through `RCTAppDelegate.initialProps` before React Native moved its startup into `scene(_:willConnectTo:)`.
