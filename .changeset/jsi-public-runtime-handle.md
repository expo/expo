---
'expo-modules-jsi': patch
---

Make `JavaScriptRuntime.handle` and `JavaScriptRuntimeHandle.runtime` public, so code that the runtime owns can refer to the runtime without retaining it or holding a `weak` reference to it.
