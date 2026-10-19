---
'@expo/ui': patch
---

[Android] Add `colorOverrides` to the Jetpack Compose `Host`. It replaces individual Material 3 color roles in the palette from `colorScheme` and `seedColor`. Compose children and `useMaterialColors()` use the result.
