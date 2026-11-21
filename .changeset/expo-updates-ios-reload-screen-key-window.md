---
'expo-updates': patch
---

[iOS] Fix `useColorScheme()` returning the system color scheme after `reloadAsync()` when the app set its own scheme with `Appearance.setColorScheme()`. The reload screen no longer becomes the key window, so React Native reads the app window when the new runtime starts.
