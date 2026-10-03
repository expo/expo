---
'expo-notifications': patch
---

Document that on Android the push token listener is also called after every `getDevicePushTokenAsync()` call, even when the token is unchanged.
