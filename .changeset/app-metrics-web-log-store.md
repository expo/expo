---
'expo-app-metrics': patch
---

[Web] Store `logEvent` records in memory on the main session, merged with global attributes, so `getLogs()` returns them on web. Metrics are still not recorded.
