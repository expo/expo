---
'expo': patch
---

Fix the error-level `Invalid state` log on iOS, and the same warning on Android, when `expo/fetch` cancels a response body. Cancelling before the first read now sets `bodyUsed`.
