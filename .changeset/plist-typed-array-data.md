---
'@expo/plist': patch
---

Fix `build()` writing the whole underlying buffer for a typed array that views only part of it, such as a `subarray()`, instead of only the bytes it views.
