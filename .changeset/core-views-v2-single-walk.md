---
'expo-modules-core': patch
---

[Internal] [iOS] Parse the props of the views of Expo Modules v2 in a single walk: each prop goes to the base view props with `setProp`, and the values of the view's own props go to the Swift decoder in one call.
