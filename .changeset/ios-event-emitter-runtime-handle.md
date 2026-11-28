---
'expo-modules-core': patch
---

[iOS] Make events and function calls faster. The `EventEmitter` class no longer keeps a weak reference to the runtime, which made every retain and release of the runtime slower.
