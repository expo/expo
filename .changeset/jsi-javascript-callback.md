---
'expo-modules-jsi': patch
---

[iOS] Add `JavaScriptCallback`, a JavaScript function that native code can keep and call later from any thread. Bindings generated for `@JS` functions use it to pass a closure argument.
