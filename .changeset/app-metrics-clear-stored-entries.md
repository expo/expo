---
'expo-app-metrics': patch
---

[iOS] Fixed `clearStoredEntries` doing nothing. It now deletes the stored metrics, logs, spans, crash reports, and pending fatal errors, while sessions that are still running keep recording ([#50373](https://github.com/expo/expo/issues/50373)).
