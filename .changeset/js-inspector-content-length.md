---
'@expo/cli': patch
---

Fix `createJsInspectorMiddleware`'s `Content-Length` header to reflect the UTF-8 byte length of the response, instead of its UTF-16 string length, which undersized the header for any inspector app metadata (e.g. a device name) containing non-ASCII characters.
