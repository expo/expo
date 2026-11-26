---
'expo': patch
---

Fix `expo/fetch` returning an empty or partial body from `text()` or `arrayBuffer()` when `response.body` is read while that call waits. `response.body` is now locked during the read, as the Fetch spec requires.
