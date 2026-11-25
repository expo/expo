---
'@expo/cli': patch
---

Add the error `name` and `code` to the JSON body of a failed manifest request, and send it with `Content-Type: application/json`. The `error` field does not change.
