---
'expo-location': patch
---

[Android] Remove the stored parent `Context` from the legacy location foreground service. `LocationTaskService` extends `Service`, which is already a `Context`, so it now reads `packageManager`, `packageName` and `resources` from itself. This drops a `lateinit` field and the public `setParentContext` setter.
