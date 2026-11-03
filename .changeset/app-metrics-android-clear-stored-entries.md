---
'expo-app-metrics': patch
---

[Android] Fix a crash on metric and log writes after `clearStoredEntries()`. The main session row is now inserted again after the clear.
