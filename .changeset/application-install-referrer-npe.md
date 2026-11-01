---
'expo-application': patch
---

[Android] Fix `getInstallReferrerAsync()` crashing the app when the Play Store returns no install referrer details. The promise now rejects instead.
