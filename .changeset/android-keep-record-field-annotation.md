---
'expo-modules-core': patch
---

[Android] Fix record arguments (such as `ImagePickerOptions` in `expo-image-picker`) failing to convert in minified release builds with `The 1st argument cannot be cast to type ...` caused by a `NullPointerException`. R8 dropped the default value of the `@Field` annotation's `key`.
