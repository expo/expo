---
'expo-app-metrics': patch
---

Breaking: remove the environment accessors (`AppMetricsUserDefaults.environment`/`getDefaultEnvironment`, `AppMetricsPreferences.getEnvironment`/`setEnvironment`/`getDefaultEnvironment`). `AppMetricsUserDefaults` is internal. `expo-observe` owns the environment setting.
