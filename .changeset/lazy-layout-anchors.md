---
'expo-router': patch
---

Read `unstable_settings.anchor` only when a layout is first needed, so async routes apply anchors and startup no longer loads every layout.
