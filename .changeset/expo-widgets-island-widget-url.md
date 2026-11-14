---
'expo-widgets': patch
---

[iOS] Fix tapping the Dynamic Island of a Live Activity not opening the deep link from a `widgetURL` modifier. The compact and minimal presentations only use a `widgetURL` set on the `DynamicIsland` itself, so the renderer now applies the first `widgetURL` set on the root of a Dynamic Island section there. A `url` passed to `start()` still takes precedence.
