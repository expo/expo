---
'expo-modules-core': patch
---

On iOS, Expo Modules v2 no longer looks up the Swift protocol conformances of each view type and its props when it registers the views at app launch and when it decodes the first props of a view type.
