---
"@expo/ui": patch
"expo-modules-core": patch
---

[Android] Fix `LazyColumn` and `LazyRow` content disappearing before a navigation pop transition finishes. `ExpoComposeView` now has an `onComposableChildrenChanged()` hook that is not called while a removed child is still animating out, and the lazy list views update their child state from it.
