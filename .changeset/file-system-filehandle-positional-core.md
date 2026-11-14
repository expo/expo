---
"expo-file-system": patch
---

Keep the `FileHandle` read/write cursor in JavaScript and read and write at explicit positions natively. This removes the per-handle locks, and concurrent async calls on one handle now run in the order they were made.
