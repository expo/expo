---
'jest-expo': patch
---

Keep the `NativeModule` event methods on generated native module mocks, so `addListener` returns a subscription with `remove()` and `expo-notifications` `setNotificationHandler()` no longer throws `handleSubscription.remove is not a function`.
