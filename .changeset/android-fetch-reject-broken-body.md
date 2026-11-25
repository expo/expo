---
'expo': patch
---

[Android] `fetch` rejects `text()` and `arrayBuffer()` when the response body fails or the request is canceled before the body ends, as on iOS. Before, they resolved with the bytes that arrived. A read of `response.body` that starts after the body failed now errors too: on Android it gave the partial body as complete, and on iOS it never settled.
