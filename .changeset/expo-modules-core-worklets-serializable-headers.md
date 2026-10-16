---
'expo-modules-core': patch
---

Fix the `Do not include this file directly` warnings from `react-native-worklets@0.13` on Android and iOS. The worklets integration now includes the specific `Serializable` headers instead of the deprecated `worklets/SharedItems/Serializable.h`.
