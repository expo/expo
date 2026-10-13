---
'expo-modules-jsi': patch
---

[iOS] Fix the `Build ExpoModulesJSI xcframework` build phase reporting `the following command failed with exit code 0 but produced no further output` on a cold build with Xcode 27. The package now builds with unused results (`NoUsage`) as errors, so a new one fails at the line that causes it.
