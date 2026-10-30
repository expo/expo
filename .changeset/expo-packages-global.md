---
'expo-modules-core': patch
---

Add `expo.packages`, which returns the native modules and shared object classes of an npm package by the package name, for example `expo.packages['expo-audio']`, on iOS and Android. Add `requireNative(packageName)` and `requireOptionalNative(packageName)`, which read it.
