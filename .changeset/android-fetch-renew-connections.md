---
'expo': patch
---

[Android] `fetch` gives new requests a new connection pool when the default network changes. After a network cut, requests no longer time out on a dead HTTP/2 connection that stays in the pool.
