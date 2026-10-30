---
'expo-blur': patch
---

[iOS] Fix `BlurView` rendering nothing when it mounts at 0×0 and is sized later, for example inside `@expo/ui`'s `MaskedView`. The blur effect is now applied after layout instead of from `draw(_:)`.
