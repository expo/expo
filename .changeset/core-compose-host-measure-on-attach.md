---
'expo-modules-core': patch
---

[Android] Fix a Jetpack Compose `Host` that stays blank when it mounts in a visible list row with `removeClippedSubviews` enabled, for example in a `FlatList`. The `Host` now measures its content when it is attached for the first time.
