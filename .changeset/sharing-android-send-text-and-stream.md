---
'expo-sharing': patch
---

On Android, return both the text and the attachment when another app shares a single item with `EXTRA_TEXT` and `EXTRA_STREAM`. Text shared with a MIME type other than `text/plain` is no longer dropped.
