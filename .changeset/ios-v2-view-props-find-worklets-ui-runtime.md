---
'expo-modules-core': patch
---

[iOS] Expo Modules v2 views apply their own props that Reanimated animates on the main thread without `installOnUIRuntime`. Expo finds the worklets UI runtime when a view first needs it.
