---
'expo-modules-core': patch
---

[Web] Fix `globalThis.expo` missing on web when Rolldown or `vite build` on Vite 8 drops `ensureNativeModulesAreInstalled` and the polyfill it imports. The module is now listed in `sideEffects`.
