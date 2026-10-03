---
'@expo/metro-file-map': patch
---

Recrawl a directory when a watch event names no file. Windows sends such an event when a directory's changes overflow the buffer they are reported through, and the watcher reported at most one file from it, so the rest of a change such as an install into `node_modules` stayed out of the file map until restart.
