---
'@expo/metro-file-map': patch
---

Close every watch handle under a deleted directory. On Windows a deleted watched directory reports its own path to its handle and repeats the report until the handle is closed, which held the bundler at about two CPU cores after a build output folder such as `dist` was deleted. A directory replaced by a new one is now recrawled, so files it no longer holds are removed from the file map.
