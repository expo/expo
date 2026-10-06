---
'expo-modules-core': patch
---

[Android] Warn instead of failing silently when `installModules()` gives up waiting for an active `ReactInstance`. Previously JSI interop was installed into a context with no active instance and the method still returned `true`, so the first visible symptom was `globalThis.expo` being undefined in JS.
