---
'expo-modules-core': major
---

[iOS] `Mutex` is now a non-copyable struct, like `Mutex` from the Synchronization framework. It keeps its lock and its value in one allocation, and `withLock` no longer does a dynamic exclusivity check. Code that copies a `Mutex` doesn't compile anymore, for example a `Mutex` stored in a struct or an array, or passed to a parameter without `borrowing`. Keep it in a `let` of a class, or in a global, static or local `let`. Rebuild frameworks that were prebuilt against an earlier version.
