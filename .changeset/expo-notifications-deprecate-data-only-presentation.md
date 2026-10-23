---
'expo-notifications': patch
---

[Android] Deprecate presenting data-only FCM messages that have `title` or `message` in `data`. The behavior does not change yet, but `expo-notifications` now logs a warning. Add the `presentDataOnlyNotificationsWithTitle` config plugin option to opt out now (`false`) or keep the current behavior until SDK 60 (`true`). See [Migrating from presenting data-only messages on Android](https://docs.expo.dev/push-notifications/what-you-need-to-know/#migrating-from-presenting-data-only-messages-on-android).
