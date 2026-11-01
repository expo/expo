---
"expo": major
"install-expo-modules": patch
---

[Android] Remove the unused `isNewArchitectureEnabled` parameter from `ReactActivityDelegateWrapper`. Bare projects need to drop the `BuildConfig.IS_NEW_ARCHITECTURE_ENABLED` argument from `ReactActivityDelegateWrapper(...)` in `MainActivity.kt`. `install-expo-modules` no longer passes it in the generated `MainActivity`.
