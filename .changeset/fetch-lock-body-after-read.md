---
'expo': patch
---

Fix `expo/fetch` leaving `response.body` unlocked after `text()` or `arrayBuffer()` starts, so a later `body.cancel()` no longer resolves and cancels the native read.
