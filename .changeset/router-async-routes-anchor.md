---
'expo-router': patch
'@expo/router-server': patch
---

Inline the anchor settings of every layout into the server-rendered HTML so `unstable_settings.anchor` seeds the navigation state on web when async routes are enabled.
