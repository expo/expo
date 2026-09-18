---
'expo-modules-autolinking': patch
'expo-modules-jsi': patch
---

[iOS] Keep checkout paths out of the Swift compilation cache key so modules importing ExpoModulesCore can reuse cached compilation results across checkouts and worktrees.
