---
'@expo/metro-file-map': patch
---

[Internal] Port `TreeFS` from upstream Metro's `main`, with `getSerializableState()` from react/metro#2219, keeping the on-demand filesystem, lazy symlink reads and snapshot root filtering.
