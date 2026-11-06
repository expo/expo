---
'expo-modules-core': patch
---

[iOS] Build module objects in each runtime that is attached to the app context, so `expo.modules` in the worklet UI runtime no longer returns objects of the main runtime. These module objects have the members of `@ExpoModule` modules that use `@JS`.
