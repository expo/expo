---
'expo-updates': patch
---

[Android] Fix `checkForUpdateAsync()` and `fetchUpdateAsync()` queued behind `reloadAsync()` comparing with the update that was running before the reload, so a check reported the running update as available.
