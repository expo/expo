---
'@expo/metro-file-map': minor
---

Update to `metro-file-map` 0.87.2, which Metro 0.87.2 requires. This adds `FileMap.addRoot()` and `FileMap.getRoots()`, and brings the 0.87.2 plugin API to plugins passed with `unstable_fileMapPlugins`: a plugin's worker can run lazily, only for the files whose data is read with `getOrComputeFileData`, and `files.lookup()` no longer returns `pluginData`. The cache format changes, so the first start after upgrading rebuilds the file map without a cache.
