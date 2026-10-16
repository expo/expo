---
'expo-sharing': patch
---

[Android] A shared `text/*` file, for example a `.txt` or `.csv` file, now has the `file` share type instead of `text`. Its `value` is a content URI, not the text. This matches iOS.
