---
'expo-file-system': patch
---

[Android] Remove the `commons-io` and `commons-codec` dependencies. On Android 7, `copyAsync` now throws an error when the source and the destination are the same file, instead of deleting the file.
