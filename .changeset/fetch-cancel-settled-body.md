---
'expo': patch
---

Fix `expo/fetch` not setting `bodyUsed` when the body is cancelled before the first read, and an `Invalid state` error log on iOS when a settled or unread body is cancelled.
