---
'expo-router': patch
---

Resolve `ExpoRouterActivityContents` on first render instead of at module scope, so importing the module before React Native has initialised no longer throws.
