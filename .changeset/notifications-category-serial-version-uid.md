---
"expo-notifications": patch
---

[Android] Fix notification action buttons going missing after an app update that changes R8 minification, until the app is opened again. `NotificationCategory`, `NotificationAction`, `TextInputNotificationAction` and `NotificationRequest` now declare the `serialVersionUID` that non-minified builds compute, so stored categories and scheduled notifications stay readable.
