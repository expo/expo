---
'expo': patch
---

Reject `expo/fetch` network failures with a `TypeError`, as the Fetch Standard requires, so retry libraries that branch on `instanceof TypeError` behave the same on native as on web, and keep the native error as the rejection’s `cause` so its `code` survives. `error.name` is now `"TypeError"` rather than `"Error"`.
