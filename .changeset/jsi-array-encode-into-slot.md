---
'expo-modules-jsi': patch
---

[iOS] Reduce the overhead of converting Swift arrays of numbers, booleans, strings and optionals to JavaScript arrays, by encoding each element straight into the array's buffer with `JavaScriptEncodable.encode(_:into:in:)`.
