---
'expo-notifications': patch
---

[iOS] Fix `content.data` being `null` for a remote notification sent directly through FCM or APNs. When the payload has no `body` dictionary, `content.data` now holds the parsed `body` JSON string, or else every top-level key except `aps`, as on Android.
