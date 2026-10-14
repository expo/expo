---
'expo-sqlite': patch
---

Fixed `getFirstSync()` and sync `for...of` so they mark the cursor as moved. A later `getFirstSync()` or `getAllSync()` throws until `resetSync()`, matching the async APIs.
