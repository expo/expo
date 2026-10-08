---
'expo-router': patch
---

[iOS] Stack headers without a background color no longer send the default theme's `card` color, so react-native-screens can use the system bar background (clear at the scroll edge, as in a plain `UINavigationController`). A custom theme's `card` color and any `headerStyle.backgroundColor` are still applied.
