---
'expo-app-intents': patch
'expo-app-metrics': patch
'expo-clipboard': patch
'expo-location': patch
'expo-updates': patch
'expo-video': patch
---

Import `expo-modules-core` APIs from `expo`. These packages declare `expo` but not `expo-modules-core`, so the import resolved only through hoisting and could load a second copy of `expo-modules-core`.
