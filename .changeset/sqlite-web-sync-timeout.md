---
'expo-sqlite': patch
---

[Web] Fixed synchronous calls throwing `Sync operation timeout` while the worker is still starting. The wait now uses one wall-clock deadline, including in browsers that provide `Atomics.pause`.

See: #51764
