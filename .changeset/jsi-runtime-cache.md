---
"expo-modules-jsi": patch
---

[iOS] Add `JavaScriptRuntime.cached(_:_:)` with typed `JavaScriptRuntime.Cache.Key`s, to create a value once per runtime and reuse it, for example a JavaScript constructor or a property name. A lookup reads one array slot, about 5× faster than the string-keyed `JavaScriptPropNameID.cached(_:_:)`.
