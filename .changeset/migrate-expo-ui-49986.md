---
"@expo/ui": patch
---

[web] Fix `ListItem` always showing a pointer cursor, even without an `onPress`, because React Native Web's `Pressable` applies one unconditionally. A `ListItem` with no `onPress` now shows the default cursor instead of misleadingly looking clickable.

See: [#49986](https://github.com/expo/expo/pull/49986)
