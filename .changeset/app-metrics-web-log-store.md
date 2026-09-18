---
'expo-app-metrics': patch
---

[Web] Store `logEvent` and `reportError` records in memory on the main session (latest 1000, merged with global attributes), so `getLogs()` returns them on web. Metrics are still not recorded.
