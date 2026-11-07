---
'expo-modules-autolinking': patch
---

[iOS] Fix the `ExpoModulesCore` checksum in `Podfile.lock` changing with the project path when precompiled modules are on. `pod install --deployment` now passes with a lockfile from another machine.
