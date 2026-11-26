---
'expo': patch
---

Fix `expo/fetch` handling of failures after response headers arrive. On iOS, `Response.body` reports failures that occur before the first read. On Android, `Response.body`, `text()`, and `arrayBuffer()` reject when the connection fails partway through the body.
