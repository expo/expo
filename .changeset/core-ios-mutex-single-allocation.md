---
'expo-modules-core': major
---

[iOS] `Mutex` is now a non-copyable struct, like `Mutex` from the Synchronization framework. It keeps its lock and its value in one allocation, and `withLock` no longer does a dynamic exclusivity check. Code that copies a `Mutex`, for example into another constant or a function argument, doesn't compile anymore. Keep it in a `let` of a class, or in a global or static `let`.
