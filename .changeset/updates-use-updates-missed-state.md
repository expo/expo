---
'expo-updates': patch
---

Fix `useUpdates()` keeping a stale state when a native state change arrives between its first render and its subscription.
