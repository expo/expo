---
'expo-modules-core': patch
---

Add `expo.packages` on iOS, which returns the native modules declared with `@ExpoModule` (Expo Modules API 2.0) of an npm package by the package name, for example `expo.packages['expo-audio']`, with the classes that those modules define. Add `requireNative(packageName)` and `requireOptionalNative(packageName)`, which read it.
