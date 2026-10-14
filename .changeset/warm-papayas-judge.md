---
'@expo/require-utils': patch
---

Fix missing `followSymlinks` case for direct-file Node candidate resolution, which would previously ignore a `followSymlinks: true` option
