---
'expo': patch
'expo-modules-core': patch
---

[Android] Fixed release builds with R8 crashing at launch with `Cannot find native module 'ExpoApplication'` (or a JNI `NoSuchFieldError` / `NoSuchMethodError`) by keeping Expo Modules v2 classes.
