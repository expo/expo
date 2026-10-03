---
'expo-router': patch
---

Load only the layouts on the initial URL when async routes are enabled, instead of every `_layout` chunk in the app. Their `unstable_settings.anchor` is read before the navigation state is seeded.
