---
'expo': minor
---

[iOS] A module built from its checked-in Package.swift can depend on the `ExpoUIHeaders` package at `../ExpoUIHeaders`. The SwiftPM plugin emits that package over the `ExpoUIHeaders.xcframework` from `@expo/ui`, together with the `ExpoModulesCoreHeaders` and `ExpoModulesWorkletsHeaders` packages it depends on.
