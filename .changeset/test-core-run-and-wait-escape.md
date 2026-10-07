---
'expo-modules-test-core': patch
---

[iOS] Fix native tests that use `TestAppContext` crashing intermittently with "closure argument was escaped in withoutActuallyEscaping block". `TestJavaScriptThread.runAndWait` now drops its reference to the operation before it wakes the caller.
