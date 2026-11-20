---
'expo': patch
---

[iOS] A module built from its checked-in Package.swift gets the React Native headers through the `ExpoModulesCoreHeaders` package. That package now depends on the React Native header products and the app's generated code package, the same as a module whose Package.swift the SwiftPM plugin generates.
