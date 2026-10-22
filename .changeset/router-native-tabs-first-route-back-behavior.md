---
'expo-router': patch
---

This is a breaking change: the default `backBehavior` of `NativeTabs` is now `firstRoute` instead of `initialRoute`. This changes only layouts that set `unstable_settings.anchor`: going back now returns to the first tab, not to the anchor. To keep the previous behavior, set `backBehavior="initialRoute"`.
