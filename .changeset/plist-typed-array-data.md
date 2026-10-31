---
'@expo/plist': patch
---

Fix `build()` writing an `ArrayBuffer` as an empty `<data/>`, and writing the whole underlying buffer for a typed array that views only part of it, such as a `subarray()`.
