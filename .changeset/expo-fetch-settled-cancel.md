---
'expo': patch
---

Fix `expo/fetch` logging `Invalid state` when a body is cancelled, and leaving `bodyUsed` false when that cancel happens before the first read.
