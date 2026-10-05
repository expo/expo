---
'expo-modules-jsi': patch
---

`JavaScriptRuntime.evalAsync` now evaluates on the JavaScript thread when called from another thread on a runtime with a scheduler, instead of on the calling thread.
