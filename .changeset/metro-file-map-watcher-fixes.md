---
'@expo/metro-file-map': patch
---

Fix file changes being missed by the watcher: changes made during startup or while the file map builds, changes Windows reports without a file name, and out-of-order events on macOS. Watches under a deleted directory are now closed, stopping the watcher no longer hangs, and a directory that replaces a file or symlink is now fully picked up.
