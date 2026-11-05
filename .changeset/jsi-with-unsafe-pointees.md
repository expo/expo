---
'expo-modules-jsi': patch
---

[Internal] Add `JavaScriptRuntime.withUnsafePointees(object:value:_:)` as `@_spi(Internal)`. It gives raw pointers to the runtime, an object and a value in one call that isn't generic, for `expo-modules-core` to emit events.
