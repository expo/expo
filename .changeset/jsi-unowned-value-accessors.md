---
'expo-modules-jsi': patch
'expo-modules-core': patch
---

[iOS] Add `isFunction()`, `isTypedArray()`, `isArrayBuffer()`, `getTypedArray(in:)`, `getArrayBuffer(in:)`, `getBigInt(in:)` and `kind` to `JavaScriptUnownedValue`. `Data`, typed arrays, `ArrayBuffer` and integers from a `BigInt` now decode function arguments without copying them into an owning `JavaScriptValue`: a `Data` argument is about 10% faster to decode, and an `Int64` from a `BigInt` about 8× faster.
