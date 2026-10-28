---
'@expo/metro-file-map': patch
---

Keep project files in the file map cache when a watch folder is an ancestor of the project root, so they aren't re-processed on every start.
