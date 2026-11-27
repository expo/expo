---
'expo-modules-jsi': patch
---

[iOS] Added `withUnsafePointee(_:)` to `JavaScriptUnownedValue`, so code that calls C++ can pass the borrowed value without a copy.
