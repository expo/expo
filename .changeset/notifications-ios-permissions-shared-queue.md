---
'expo-notifications': patch
---

[iOS] Fix `getPermissionsAsync` blocking the async functions of other modules, such as `expo-secure-store`, until iOS returns the notification settings.
