---
'expo': minor
---

[iOS] A module built from its checked-in Package.swift can depend on the `ExpoModulesWorkletsHeaders` package at `../ExpoModulesWorkletsHeaders`. The SwiftPM plugin emits that package over the `ExpoModulesWorkletsHeaders.xcframework` from `expo-modules-core`, together with the `ExpoModulesCoreHeaders` package it depends on.
