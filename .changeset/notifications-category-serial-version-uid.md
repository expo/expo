---
"expo-notifications": patch
---

[Android] Fix notification action buttons going missing after an app update that changes R8 minification, until the app is opened again. `NotificationCategory` and `TextInputNotificationAction` now declare the `serialVersionUID` that non-minified builds compute, so stored categories stay readable.
