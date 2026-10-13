---
'expo-modules-jsi': patch
---

[iOS] Make `JavaScriptFunction`, `JavaScriptArrayBuffer`, `JavaScriptTypedArray`, `JavaScriptBigInt`, `JavaScriptWeakObject` and `JavaScriptPropNameID` hold the runtime handle instead of a weak reference to the runtime, and clone the engine value once in `JavaScriptValue.getFunction()`, `JavaScriptValue.getArrayBuffer()` and `JavaScriptFunction.asObject()`. Calling a JavaScript function from Swift is about twice as fast.
