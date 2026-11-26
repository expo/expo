---
"expo-file-system": minor
---

`FileHandle` reads and writes take an `at` option that uses a byte position and leaves `offset` unchanged. Add `FileHandle.readInto` and `readIntoSync`, which read into a buffer you own and return the number of bytes read. `writeBytes` and `writeBytesSync` now also accept an `ArrayBuffer` or any `ArrayBufferView`.
