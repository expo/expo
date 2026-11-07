---
'@expo/metro-file-map': patch
---

Fix symlinks to `..` and chains of 40 or more symlinks being reported as missing, and a `Failed to collapse` error when resolving through a symlink to an ancestor of the project root. Files under a symlinked watch folder are now kept in the file map cache when using Watchman.
