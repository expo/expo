---
'@expo/metro-file-map': patch
---

Stop watching directories under `.git`, `.hg` and `.cxx` on Linux and Windows. Their changes were already ignored, but a watcher was still opened for each of these directories.
