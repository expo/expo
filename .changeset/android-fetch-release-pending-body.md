---
'expo': patch
---

[Android] Fix `expo/fetch` resolving `arrayBuffer()` or `text()` with an empty or truncated body, or crashing, when the response is released while the body is read.
