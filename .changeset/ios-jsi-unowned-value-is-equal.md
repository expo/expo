---
'expo-modules-jsi': patch
---

[iOS] Add `JavaScriptUnownedValue.isEqual(to:)`, which compares a borrowed value with a `JavaScriptValue` like `===` in JavaScript, without copying the borrowed value.
