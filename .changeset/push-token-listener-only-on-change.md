---
'expo-notifications': patch
---

Emit the push token listener event only when the device push token changes, on both Android and iOS. Previously, every `getDevicePushTokenAsync()` call emitted the event, even when the token was unchanged.
