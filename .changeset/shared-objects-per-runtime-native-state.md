---
'expo-modules-core': patch
---

[iOS] Give a shared object one JS object with a native state of its own in each runtime other than the main runtime. `SharedObject.__resolveInWorklet` now returns the same JS object each time, and `release()` on it releases the native object.
