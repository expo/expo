---
'expo-modules-jsi': patch
---

[iOS] Reduce the overhead of `JavaScriptFunction.call(arguments:)`, `call(this:arguments:)` and `callAsConstructor(_:)` when they receive Swift values as arguments.
