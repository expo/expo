---
'expo-modules-test-core': patch
---

Add `JavaScriptTestThread`, which makes an app context for native tests whose runtime has a JavaScript thread of its own. Use it to test async functions that settle their promises from other threads: with the runtime of `AppContext.create()`, such a settle can run concurrently with the test's JavaScript and crash Hermes.
