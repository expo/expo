---
'expo-modules-core': patch
---

On iOS, registering the views of Expo Modules v2 at app launch no longer looks up the Swift protocol conformances of each view type and its props.
