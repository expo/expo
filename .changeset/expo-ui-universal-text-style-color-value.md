---
'@expo/ui': patch
---

Fix TypeScript rejecting a `PlatformColor` as the text color of the universal `Text`, `TextInput`, and `Collapsible`. The `color` of `UniversalTextStyle` is now a `ColorValue`.
