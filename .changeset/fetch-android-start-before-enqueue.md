---
'expo': patch
---

[Android] Fix `fetch` resolving `text()` with an empty body, or never settling after a fast connection failure, when OkHttp calls back before the request is marked as started.
