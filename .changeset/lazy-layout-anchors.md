---
'expo-router': patch
---

Read `unstable_settings.anchor` only when a layout is first needed, so async routes apply anchors and startup no longer loads every layout. Anchors set in `unstable_settings` no longer decide between equally specific URL matches in different groups.
