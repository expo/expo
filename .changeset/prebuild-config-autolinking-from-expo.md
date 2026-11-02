---
'@expo/prebuild-config': patch
---

Load `expo-modules-autolinking` through the project's `expo` package instead of depending on it directly, so it uses the version that `expo` pins.
