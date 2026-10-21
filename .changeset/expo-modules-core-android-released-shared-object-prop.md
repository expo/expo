---
'expo-modules-core': patch
'@expo/ui': patch
---

[Android] Fix "Cannot use shared object that was already released" errors when a view with a shared object prop, such as the `@expo/ui` `TextInput`, is remounted right after its first render.
