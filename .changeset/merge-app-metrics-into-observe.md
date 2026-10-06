---
'expo-observe': patch
---

**Breaking:** Merge `expo-app-metrics` into `expo-observe`. The `expo-app-metrics` package is removed and its code now ships inside `expo-observe`. The main `expo-observe` API, the native module names, and all data stored on the device do not change.

To migrate:

- Remove `expo-app-metrics` from your dependencies.
- In JavaScript, use `Observe` from `expo-observe`, or import the former `expo-app-metrics` exports from `expo-observe/app-metrics`.
- On iOS, replace `import ExpoAppMetrics` with `import ExpoObserve`. Objective-C headers move from `<ExpoAppMetrics/…>` to `<ExpoObserve/…>`.
- On Android, depend on the `:expo-observe` Gradle project instead of `:expo-app-metrics`. Kotlin packages (`expo.modules.appmetrics.*`) do not change.

Fix Android reporting the `expo-app-metrics` version instead of the `expo-observe` version as `telemetry.sdk.version`.
