---
'expo-modules-core': patch
---

Accept `react-native-worklets@^0.13.0` as an optional peer dependency, so `npm install` no longer fails with `ERESOLVE` in SDK 58 projects that install the bundled `react-native-worklets` version.
