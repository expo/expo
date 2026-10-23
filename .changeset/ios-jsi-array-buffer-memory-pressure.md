---
'expo-modules-jsi': patch
---

[iOS] Fix apps running out of memory when native functions return large `Data` values to JavaScript in a loop, because the garbage collector did not count the memory of the new array buffers. Also reduce the overhead of converting `Data` values to JavaScript.
