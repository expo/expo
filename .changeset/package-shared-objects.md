---
'expo-modules-autolinking': patch
'expo-modules-core': patch
'expo-brownfield': patch
---

Export the `public` `@SharedObject` classes of a package next to its modules, for example `expo.packages['expo-audio'].AudioPlayer`, on iOS. Autolinking finds the classes with `scan-modules` and lists them in the generated `ExpoPackage`. The `classes:` argument of `@ExpoModule` is deprecated.
