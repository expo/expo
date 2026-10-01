---
'expo-notifications': minor
---

add `enableRemoteNotifications` to config plugin options to skip aps entitlement.

This allows  free Apple developer account users build expo app with just LocalNotifications( by setting value to `false`). set to `true` by default
