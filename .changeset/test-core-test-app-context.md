---
'expo-modules-test-core': patch
---

Add `TestAppContext`, an app context for native tests whose runtime has a JavaScript thread of its own. Use it to test async functions that suspend before they settle: with the runtime of `AppContext.create()`, such a function settles its promise from another thread while the test may still be running JavaScript, which can crash Hermes.
