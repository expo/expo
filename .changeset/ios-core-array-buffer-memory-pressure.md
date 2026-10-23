---
'expo-modules-core': patch
---

[iOS] Fix apps running out of memory when native functions return many new `ArrayBuffer` values to JavaScript, because the garbage collector did not count their memory.
