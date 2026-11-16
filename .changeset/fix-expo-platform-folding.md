---
'@expo/metro-config': patch
---

Fix production folding of `Platform.OS` and `Platform.select` through named, default, and namespace imports in the Rust transformer, including `expo` re-exports and React Native subpaths. Preserve import side effects when folding removes all uses of an imported value.
