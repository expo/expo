---
'expo-modules-autolinking': minor
'expo-modules-core': patch
---

On iOS, the `ExpoPackage` of each package in generated modules providers also lists the `@SharedObject` and `@ExpoView` classes that `scan-modules` finds, in `sharedObjects` and `views`. Add `views` to `ExpoPackage`.
