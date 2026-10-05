---
'expo-modules-jsi': patch
---

[iOS] Add `JavaScriptCallback`, a JavaScript function that native code can keep and call later from any thread, and `JavaScriptValue.isThenable()`. Bindings generated for `@JS` functions use `JavaScriptCallback` to pass a closure argument.
