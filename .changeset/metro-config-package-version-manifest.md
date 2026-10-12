---
'@expo/metro-config': patch
---

Read the versions of `react-native-reanimated`, `react-native-worklets`, `@babel/runtime` and `sass` from each package's own `package.json`. Metro's transform cache is now invalidated when the Reanimated or Worklets Babel plugin changes version, and the installed `@babel/runtime` version reaches the Babel transforms.
