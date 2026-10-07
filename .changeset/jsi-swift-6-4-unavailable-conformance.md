---
'expo-modules-jsi': patch
---

[iOS] Fix `Conformance of 'Bool' to 'JavaScriptRepresentable' is unavailable` build errors with Xcode 27.1 (Swift 6.4). Swift 6.4 printed placeholder conformances marked `@available(*, unavailable)` into the public `.swiftinterface`, and the leftover attributes attached to the next declaration.
