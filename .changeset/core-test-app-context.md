---
'expo-modules-core': patch
---

[Internal] Add `TestAppContext`, an `AppContext` for native tests whose runtime has a JavaScript thread of its own. Use it in place of `AppContext.create()` in tests that call async functions.
