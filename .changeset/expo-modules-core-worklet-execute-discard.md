---
'expo-modules-core': patch
---

Fix an `-Wunused-result` warning in `Worklet.cpp` on Android when building with `react-native-worklets@0.13`. Running a worklet synchronously now discards its return value while the worklet runtime lock is still held, on Android and iOS.
