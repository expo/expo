---
'expo-modules-core': patch
---

[iOS] Fix `EXC_BAD_ACCESS` crash when an async function resolves against a torn-down app context, for example when a headless background task finishes after the context is deallocated.
