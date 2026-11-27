---
'expo-updates': patch
---

Fix `useUpdates()` missing a state change, such as a finished startup download, that arrives after the first render and before the hook adds its listener.
