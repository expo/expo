---
'expo-file-system': patch
---

[Android] Fix `copy()` and `move()` with `overwrite: true` deleting the source when the destination is a SAF (`content://`) document that is the source or contains it. These calls now throw instead.
