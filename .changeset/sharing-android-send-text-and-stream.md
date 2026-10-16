---
'expo-sharing': patch
---

[Android] Return both the text and the attachment when an app shares one item with `EXTRA_TEXT` and `EXTRA_STREAM`. Text shared with a MIME type other than `text/plain` is no longer dropped.
