---
'expo': patch
'expo-modules-jsi': patch
---

[iOS] Build `ExpoModulesJSI` during the Xcode build of a Swift Package Manager app, against the app's React Native. Expo source packages compile against the `ExpoModulesJSIHeaders` XCFramework that `expo-modules-jsi` ships, and the new "Build ExpoModulesJSI" build phase runs a script in `expo-modules-jsi` that builds, links and embeds the framework.

The build phase copies the framework's dSYM to the app's dSYM folder, so archives symbolicate `ExpoModulesJSI` crashes.

Sync fails with an error that names both versions when the `ExpoModulesJSIHeaders` XCFramework comes from another version of `expo-modules-jsi` than the installed sources.
