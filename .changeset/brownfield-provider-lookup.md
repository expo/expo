---
'expo-modules-core': patch
---

[iOS] Fix slow cold launches in brownfield apps where the `ExpoModulesProvider` lookup scanned `Bundle.allFrameworks` inside `+load`. The lookup now tries the framework that contains ExpoModulesCore before falling back to the scan.
