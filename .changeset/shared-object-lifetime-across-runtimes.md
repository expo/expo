---
'expo-modules-core': patch
---

[iOS] Keep a shared object until its JS objects in all runtimes are garbage-collected, so a worklet can keep using an object that the main runtime no longer references. `release()` still releases it in every runtime.
