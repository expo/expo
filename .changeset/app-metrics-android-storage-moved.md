---
'expo-app-metrics': patch
---

Breaking: [Android] Metric storage moved to `expo-observe`. `AppMetricsModule.sessionManager`, `AppMetricsModule.setEnvironment`, and the `expo.modules.appmetrics.storage` package are removed. Without `expo-observe`, metrics are not stored.
