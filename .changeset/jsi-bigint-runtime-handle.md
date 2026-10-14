---
'expo-modules-jsi': patch
---

[iOS] Make `JavaScriptValue.getBigInt()` about 7× faster by reading the runtime through its handle, and make the `JavaScriptBigInt` initializers take the runtime as `borrowing`, so callers no longer retain it: `init(_:fromInt64:)` and `init(_:fromUint64:)` are about 3× faster. `init(_:string:)` caches the global `BigInt` function and passes the string without an arguments buffer, which makes it up to 2.3× faster; it is now isolated to `JavaScriptActor`.
