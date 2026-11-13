---
'expo-app-metrics': major
---

Replace `expo-app-metrics` with a stub that throws on import. The code moved to `expo-observe`. Import the API from `expo-observe` and the debug-only APIs from `expo-observe/debug`, then remove `expo-app-metrics` from your dependencies.
