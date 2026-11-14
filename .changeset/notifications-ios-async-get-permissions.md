---
'expo-notifications': patch
---

[iOS] Read notification permissions in `getPermissionsAsync` without blocking the queue that every module's async functions share.
