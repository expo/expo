---
'expo-modules-core': patch
---

[Android] Fix an `-Wunused-result` warning in `Worklet.cpp` when building with `react-native-worklets@0.13`. `Worklet.execute` now calls `runSyncAndDiscard`, so the worklet's return value is destroyed while the worklet runtime lock is still held.
