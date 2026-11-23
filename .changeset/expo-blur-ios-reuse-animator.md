---
'expo-blur': patch
---

[iOS] Fix main-thread hangs when `BlurView` `intensity` changes often, for example when it is animated. An intensity change now moves the existing animator instead of creating a new one.
