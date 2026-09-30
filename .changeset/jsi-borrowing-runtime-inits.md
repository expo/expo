---
"expo-modules-jsi": patch
---

[iOS] The `JavaScriptValue`, `JavaScriptObject` and `JavaScriptArray` initializers now take the runtime as `borrowing`, so callers no longer retain it for the call, making host functions that return strings or numbers up to ~15% faster.
