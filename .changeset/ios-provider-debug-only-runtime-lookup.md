---
'expo-modules-autolinking': patch
---

[iOS] The generated modules provider finds the classes of debug-only packages, such as `expo-dev-launcher`, by name at runtime instead of importing their Swift modules, so a Release build with Swift Package Manager links when the debug-only packages are empty.
