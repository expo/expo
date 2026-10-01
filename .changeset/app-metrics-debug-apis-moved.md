---
'expo-app-metrics': patch
---

Breaking: remove the private debug APIs `getInactiveSessions`, `getAllCrashReports`, `clearStoredEntries`, and `Session.getMetrics`/`getLogs`, and the `DebugSession` type. Use the same APIs on `Observe` from `expo-observe`.
