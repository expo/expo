---
'expo-widgets': patch
---

Fix Android apps crashing at launch with `constructor cannot be null` when they use expo-widgets. The `CustomNotification` class now has a constructor that throws, because instances only come from `CustomNotificationFactory`.
