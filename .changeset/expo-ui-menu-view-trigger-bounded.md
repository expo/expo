---
'@expo/ui': patch
'expo-modules-core': patch
---

[iOS] Fix `MenuView` triggers with `width: '100%'` or `flex: 1` measuring as if they had unbounded width, so their text did not wrap and they kept their first size after rotation.
