---
'expo-linking': patch
---

[Web] Stop encoding query parameter values twice in `createURL()`. `parse()` now returns the values that were passed to `createURL()`.
