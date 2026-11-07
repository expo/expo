---
'expo-intent-launcher': patch
---

Fix `startActivityAsync` on Android returning the result `Intent`'s `toString()` (`"Intent { dat=content://… flg=… }"`) as `data` instead of the result's data URI. `data` is now the URI the activity returned, for example the `content://` URI from `ACTION_CREATE_DOCUMENT`, as the type docs describe.
