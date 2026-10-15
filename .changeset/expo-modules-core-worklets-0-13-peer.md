---
'expo-modules-core': patch
---

Allow `react-native-worklets` `^0.11.0`, `^0.12.0`, and `^0.13.0` in peer dependencies. SDK 58 installs `react-native-worklets@0.13.0`, so npm reported `ERESOLVE overriding peer dependency` and installed a second, nested copy of `react-native-worklets@0.10.4`, and installs with `npm --strict-peer-deps` or `pnpm --strict-peer-dependencies` failed.
