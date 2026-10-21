---
'expo-router': patch
---

This is a breaking change: a layout without `unstable_settings.anchor` no longer uses the route named like its group as the anchor. To keep that back destination, export `unstable_settings = { anchor: '<route>' }` from the layout.
