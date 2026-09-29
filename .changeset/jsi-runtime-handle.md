---
"expo-modules-jsi": patch
---

[iOS] `JavaScriptValue`, `JavaScriptObject` and `JavaScriptArray` now hold a strong runtime handle instead of a `weak` reference to the runtime, which removes the weak reference traffic and slow-path reference counting from their hot paths (for example `getObject()` ~16×, `getArray()` ~12× and `getProperty(_:)` ~1.8× faster).
