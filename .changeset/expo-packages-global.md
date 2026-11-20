---
'expo-modules-core': patch
---

Add `expo.packages` on iOS, which returns the native exports of an npm package by the package name, for example `expo.packages['expo-audio']`. A package object has the modules and shared object classes that the modules provider lists for the package, as siblings that are created on the first access. It is separate from `expo.modules`. Add `requireNative(packageName)` and `requireOptionalNative(packageName)`, which read it.
