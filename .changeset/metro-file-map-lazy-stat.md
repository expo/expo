---
'@expo/metro-file-map': patch
---

Without Watchman, files are now stat'd only once Metro derives data from them, and a start stats only those files. This fixes SHA-1s and plugin data (e.g. dependencies) that could go stale when a file was edited while Metro wasn't running, and recrawls that could miss changes to files that had not been stat'd yet.
