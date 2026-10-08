---
"expo-screen-orientation": patch
---

Fix a crash on iOS (`EXC_BAD_ACCESS` in libobjc) caused by a data race on `ScreenOrientationRegistry.currentTraitCollection`, which is written on the main thread and read on the background queue that notifies orientation listeners.
