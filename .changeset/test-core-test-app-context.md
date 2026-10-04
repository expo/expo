---
'expo-modules-test-core': patch
---

Add `TestAppContext`, an `AppContext` for native tests whose runtime has a JavaScript thread of its own. Use it in place of `AppContext.create()` in tests that call async functions: with a runtime that has no JavaScript thread, an async function can settle its promise concurrently with the test's JavaScript and crash Hermes.
