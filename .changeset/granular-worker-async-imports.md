---
'@expo/metro-config': patch
---

Use granular chunking for web exports that have async imports inside web workers. The file of a web worker includes the modules that the worker imports asynchronously.
