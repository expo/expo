---
'@expo/metro-config': patch
---

Fix `new SharedWorker(new URL(...))` creating a dedicated `Worker` instead of a `SharedWorker` on web.
