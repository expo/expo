---
'expo': patch
---

Fix `expo/fetch` logging `Invalid state` and leaving `bodyUsed` false when a body is cancelled before the first read.
