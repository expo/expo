---
'expo': minor
---

[iOS] A module built from its checked-in Package.swift can depend on a React Native library through a placeholder package: `../RNWorkletsHeaders` for `react-native-worklets` and `../RNScreensHeaders` for `react-native-screens`. The SwiftPM plugin links each placeholder to the package that React Native links for the library. Swift code cannot import `RNScreens` from the Package.swift of `react-native-screens` 5.0.0-beta.1 yet, because of how that package exposes its headers.
