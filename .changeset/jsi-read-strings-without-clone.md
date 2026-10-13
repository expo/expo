---
'expo-modules-jsi': patch
---

[iOS] Read strings from `JavaScriptValue` and `JavaScriptUnownedValue` without cloning the engine string handle, which saves a few nanoseconds on every string argument and `getString()` call.
