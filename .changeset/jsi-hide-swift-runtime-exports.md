---
'expo-modules-jsi': patch
'expo-modules-core': patch
---

[iOS] Fix a launch crash (`Symbol not found: _swift_allocateMetadataPack`) in apps that use precompiled Expo modules and build with Xcode 27. `ExpoModulesJSI` no longer exports Swift runtime symbols, so the precompiled `ExpoModulesCore` no longer depends on them.
