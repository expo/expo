---
'expo-modules-core': patch
---

[Android] Fix record arguments without `@OptimizedRecord` (such as `ImagePickerOptions` in older `expo-image-picker` versions) failing to convert in minified release builds with `The 1st argument cannot be cast to type ...` caused by a `NullPointerException`. Keep the `@Field` annotation class from being renamed by R8.
