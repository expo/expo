---
'expo': minor
---

[iOS] A module built from its checked-in Package.swift can depend on a React Native library through a placeholder package: `../RNWorkletsHeaders` for `react-native-worklets` and `../RNScreensHeaders` for `react-native-screens`. The SwiftPM plugin links each placeholder to the package that React Native links for the library. When `react-native-worklets` is installed, the SwiftPM plugin also generates the package for `ExpoModulesWorkletsAdapter`, so the adapter is no longer left out.
