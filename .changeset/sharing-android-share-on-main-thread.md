---
"expo-sharing": patch
---

Fix `shareAsync` on Android sometimes rejecting with a `NullPointerException` in `dispatchCancelPendingInputEvents` by starting the share chooser on the main thread.
