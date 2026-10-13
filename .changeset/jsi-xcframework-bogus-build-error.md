---
'expo-modules-jsi': patch
---

[iOS] Fix the `Build ExpoModulesJSI xcframework` build phase showing `Command PhaseScriptExecution emitted errors but did not return a nonzero exit code` on a cold build with Xcode 27. The nested `xcodebuild` printed an `error:` line for a compile step that emitted only a warning, and the host build reported it as an error. The warning is fixed, and `error:` lines from a nested build that succeeds are now printed as warnings.
