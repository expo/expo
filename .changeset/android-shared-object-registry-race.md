---
"expo-modules-core": patch
---

[Android] Fixed a race in `SharedObjectRegistry` where a live shared object passed to an async function could be reported as already released (`UsingReleasedSharedObjectException`) while another thread added or released a shared object.
