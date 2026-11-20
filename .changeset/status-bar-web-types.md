---
'expo-status-bar': patch
---

[Web] Give `StatusBar` and its methods the same types on web as on Android and iOS. Before, a TypeScript 7 project that type checks with `moduleSuffixes: [".web", ""]` got an error for each `StatusBar` prop and method argument.
