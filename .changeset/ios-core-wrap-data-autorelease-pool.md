---
'expo-modules-core': patch
---

[iOS] Fix `ArrayBuffer.wrap(dataWithoutCopy:)` keeping the bytes of released buffers alive until the current autorelease pool drains, which could make apps run out of memory when JavaScript calls a native function in a loop.
