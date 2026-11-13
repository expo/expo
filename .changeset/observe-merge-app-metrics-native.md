---
'expo-observe': major
---

Move the native code of `expo-app-metrics` into `expo-observe`. `expo-observe` now has one iOS pod (`ExpoObserve`) and one Android Gradle project (`expo-observe`) that register both native modules (`ExpoAppMetrics`, `ExpoObserve`). The stored data does not change.
