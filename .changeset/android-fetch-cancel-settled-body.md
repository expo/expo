---
'expo': patch
---

Fix an `Invalid state` warning on Android when an `expo/fetch` body is cancelled before the first read or after it settled. A cancel before the first read now sets `bodyUsed` and drops the chunks buffered so far.
