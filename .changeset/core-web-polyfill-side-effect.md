---
'expo-modules-core': patch
---

[Web] Fix `globalThis.expo` missing on web when a bundler that trusts `sideEffects` (Rolldown, Vite 8) drops `ensureNativeModulesAreInstalled.ts`, which loads the web polyfill.
