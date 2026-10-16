---
'expo-modules-core': patch
---

Fix an `-Wunused-result` warning in `Worklet.cpp` on Android when building with `react-native-worklets@0.13`. `Worklet.execute` now discards the worklet's return value while the worklet runtime lock is still held, on Android and iOS.
