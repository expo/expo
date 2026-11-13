---
'expo-modules-jsi': patch
---

[iOS] Add `JavaScriptRuntime.HostFunctionClosure`, a host function closure that writes its result into the engine's result slot with `JavaScriptEncodable.encode(_:into:in:)` and receives the runtime as a parameter, with `createFunction` and `JavaScriptObject.setProperty(_:function:)` overloads for it. This reduces the overhead of returning numbers, booleans and strings from native functions.
