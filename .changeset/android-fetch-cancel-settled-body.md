---
'expo': patch
---

Fix an `Invalid state` warning on Android when an `expo/fetch` body is cancelled before the first read or after it settled, and drop the buffered body on cancel.
