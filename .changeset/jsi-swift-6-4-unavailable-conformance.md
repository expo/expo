---
'expo-modules-jsi': patch
---

[iOS] Fix `Conformance of 'Bool' to 'JavaScriptRepresentable' is unavailable` build errors with Xcode 27.1 (Swift 6.4): the `@available(*, unavailable)` attribute before each stripped package-internal conformance in the `.swiftinterface` was left behind and attached to the next declaration.
