---
'expo-app-metrics': patch
---

Breaking: [iOS] Metric storage moved to `expo-observe`. The storage read API (`AppMetrics.getMetrics(afterId:)` and related functions), `AppMetrics.setEnvironment`, and the row types are removed. Without `expo-observe`, metrics are not stored.
