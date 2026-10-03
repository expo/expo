---
'expo-widgets': patch
---

[Android] Fix `generateExpoWidgetsLayoutRegistry` failing on Windows with `RangeError: Maximum call stack size exceeded` when a widget sets `initialLayout`. Absolute Windows paths (`D:\...`) are now resolved as files instead of being stubbed as empty modules.
