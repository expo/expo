---
'expo-modules-core': patch
---

[iOS] Fixed Expo Modules v2 views not applying their own props that Reanimated animates on the main thread, when the app installs Expo on the worklets UI runtime with `installOnUIRuntime`.
