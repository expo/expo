---
'@expo/cli': patch
'create-expo': patch
'expo-doctor': patch
---

Treat non-boolean `CI` values, like `CI=yes`, as false instead of failing.
