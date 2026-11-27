---
'expo-modules-core': minor
---

[iOS] Add a backport of [`Atomic`](https://developer.apple.com/documentation/synchronization/atomic) from the Synchronization framework for older platform versions. A counter or a flag costs less with `Atomic` than with `Mutex`.
