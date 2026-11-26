---
'jest-expo': patch
---

Make `addListener` on generated native module mocks register the listener and return a subscription with `remove()`, so `expo-notifications` `setNotificationHandler()` no longer throws `handleSubscription.remove is not a function`.
