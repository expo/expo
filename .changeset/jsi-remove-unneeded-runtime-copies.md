---
'expo-modules-jsi': patch
'expo-modules-core': patch
---

[iOS] [Internal] Remove `copy runtime` where a borrowed `JavaScriptRuntime` is passed to a function, which already borrows its parameters.
