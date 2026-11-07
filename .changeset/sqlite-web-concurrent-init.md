---
'expo-sqlite': patch
---

[Web] Fix database calls that fail with "Invalid VFS state" or `InvalidStateError` when the web worker receives a second call before its first initialization is complete.
