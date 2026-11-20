---
'expo-file-system': patch
---

Fix `copy()` and `move()` with `overwrite: true` deleting the source when the destination resolves to the source or to a directory that contains it. These calls now throw instead.
