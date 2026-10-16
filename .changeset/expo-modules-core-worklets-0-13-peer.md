---
'expo-modules-core': patch
---

Change the optional `react-native-worklets` peer dependency to `0.13.0`, the version bundled with SDK 58. `npm install` no longer fails with `ERESOLVE` when the bundled `react-native-worklets` version is installed. Earlier `react-native-worklets` versions do not support React Native 0.88.
