---
'expo-video': patch
---

[Web] Fix `VideoView` keeping a stale `<video>` element when it receives a new one that is structurally identical, which could make the player drive a detached element. The ref now compares elements by identity instead of `isEqualNode`.
