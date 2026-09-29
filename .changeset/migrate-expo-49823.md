---
"expo": patch
---

[iOS] Bring the `Package.swift` the SwiftPM autolinking plugin generates up to what CocoaPods already carries: a module's build settings, its declared iOS deployment floor and its `PrivacyInfo.xcprivacy`, plus `RCT_NEW_ARCH_ENABLED` for the `ExpoObjC` target. Modules the plugin cannot place are now reported with the reason and the fix, including one whose `Package.swift` depends on a target the generated package cannot declare. The podspec reader no longer mistakes a `test_spec`'s linkage for the module's own.

See: [#49823](https://github.com/expo/expo/pull/49823)
