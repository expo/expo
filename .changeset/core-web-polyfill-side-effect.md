---
'expo-modules-core': patch
---

[Web] Fix `globalThis.expo` missing on web when a bundler that trusts `sideEffects` (Rolldown, `vite build` on Vite 8) drops the empty `ensureNativeModulesAreInstalled` call and the polyfill it imported. The function now installs the polyfill itself.
