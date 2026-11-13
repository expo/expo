---
'expo': patch
---

[iOS] A module built from its checked-in Package.swift gets the Expo Swift macros through the `ExpoModulesCoreHeaders` package, which depends on the `expo-modules-macros` Swift package. The SwiftPM plugin no longer links the macro plugin into the build folder, and the manifest needs no unsafe flags.
