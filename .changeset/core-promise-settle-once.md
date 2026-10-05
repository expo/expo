---
'expo-modules-core': patch
---

[Android] Fixed a race where a promise resolved and rejected from different threads at the same time could settle twice and throw on the JavaScript thread.
