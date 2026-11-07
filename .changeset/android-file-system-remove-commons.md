---
'expo-file-system': patch
---

[Android] Remove the `commons-io` and `commons-codec` dependencies. The legacy API now uses the Kotlin standard library and `MessageDigest` instead. If your Android code uses these libraries through `expo-file-system`, add them to your own dependencies. On Android 7, `copyAsync` now throws an error when the source and the destination are the same file, instead of deleting the file.
