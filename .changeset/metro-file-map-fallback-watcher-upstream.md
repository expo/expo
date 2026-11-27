---
'@expo/metro-file-map': patch
---

Port `FallbackWatcher`, the default watcher on Linux and Windows, from upstream Metro. It starts without a stat per file or a 1s delay on Windows, closes every watch under a deleted directory, and has the file map recrawl a directory when Windows doesn't name what changed.
