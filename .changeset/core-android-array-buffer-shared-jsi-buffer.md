---
'expo-modules-core': patch
---

[Android] Fix a crash when a function returns the same `ArrayBuffer` to JavaScript many times. Each return held a new JNI global reference until garbage collection, which overflowed the global reference table.
