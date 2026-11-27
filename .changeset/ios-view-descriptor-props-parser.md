---
'expo-modules-core': patch
---

[iOS] Register native views faster at launch. A view descriptor no longer prepares its own props parser: views of Expo Modules v2 don't use it, and views of Expo Modules v1 share one prepared parser.
