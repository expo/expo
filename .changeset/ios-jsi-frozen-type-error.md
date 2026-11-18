---
'expo-modules-jsi': patch
'expo-brownfield': patch
---

[iOS] Reduce the overhead of calling the throwing `as…()` conversions of `JavaScriptValue` and `JavaScriptUnownedValue` from another module. `JavaScriptValue.TypeError` is now `@frozen`.
