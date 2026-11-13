---
'expo-modules-jsi': patch
---

[Internal] [iOS] Add `JavaScriptRuntime.for(unsafePointer:)` as SPI, which finds the `JavaScriptRuntime` that wraps a `jsi::Runtime` from the engine runtime's address.
