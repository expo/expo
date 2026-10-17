---
'expo-modules-jsi': patch
---

[iOS] Reduce the overhead of converting `Date` and `Data` values between JavaScript and native code, and of `JavaScriptRuntime.createObject(prototype:)`. The global functions that these conversions call are now looked up once per runtime and cached.
