---
"expo-sharing": patch
---

Fix the Android config plugin emitting data-less `SEND` and `SEND_MULTIPLE` intent filters when `singleShareMimeTypes` or `multipleShareMimeTypes` is empty or omitted. A filter without `<data>` matches every MIME type, so the app appeared in share sheets for arbitrary content; empty lists now emit no filter.
