---
'expo-modules-core': patch
---

[iOS] Schedule work on the worklet UI runtime through the scheduler of `react-native-worklets`, so `schedule` and `execute` on `WorkletRuntime` run on the UI thread instead of the calling thread.
