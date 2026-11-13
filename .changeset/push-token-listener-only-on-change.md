---
'expo-notifications': patch
---

Behavior change: a push token listener added with `addPushTokenListener` is now called only when the token differs from the last one it received, on all platforms. Previously, it was called with every `onDevicePushToken` event, for example after each `getDevicePushTokenAsync()` call, even when the token was unchanged. Each listener keeps track of its own last token.
