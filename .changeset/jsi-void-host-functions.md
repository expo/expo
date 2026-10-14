---
'expo-modules-jsi': patch
---

[iOS] Add `createFunction` and `setProperty(_:function:)` overloads taking a `VoidFunctionClosure`, for host functions that return nothing to JavaScript. They make such calls faster because they skip creating and writing the result value.
