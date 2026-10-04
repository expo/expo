---
'expo-modules-test-core': patch
---

Add `TestAppContext`, an `AppContext` for native tests whose runtime has its own JavaScript thread. Use it in place of `AppContext.create()` in tests that call async functions.
