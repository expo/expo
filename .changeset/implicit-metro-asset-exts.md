---
'@expo/cli': minor
'@expo/metro-config': minor
---

Resolve imports of existing files whose extension isn't in `resolver.sourceExts` or `resolver.assetExts` as assets, so new asset types no longer need to be added to `resolver.assetExts` in `metro.config.js`.
